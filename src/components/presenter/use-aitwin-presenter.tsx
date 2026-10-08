"use client";

import type { AiTwinHandle, AvatarTtsLipsyncStatus } from "@streamoji/aitwin";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PresenterConfig } from "@/lib/presenter/types";
import type { Presenter, PresenterOptions } from "./types";

const SESSION_ENDPOINT = "/api/avatar/aitwin";

const AiTwinStage = dynamic(() => import("./aitwin-stage"), { ssr: false });

const prepare = () => {};

const BUSY_STATUSES: AvatarTtsLipsyncStatus[] = ["loading", "speaking"];

export function useAiTwinPresenter(
  { enabled }: PresenterOptions,
  config: PresenterConfig,
): Presenter {
  const twinId = config.id === "aitwin" ? config.twinId : "";
  const voiceId = config.id === "aitwin" ? config.voiceId : undefined;
  const [token, setToken] = useState<string>();
  const [status, setStatus] = useState<AvatarTtsLipsyncStatus>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const handleRef = useRef<AiTwinHandle | null>(null);
  const bufferRef = useRef("");
  const queuedRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(SESSION_ENDPOINT, { method: "POST" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body: { token: string }) => active && setToken(body.token))
      .catch(() => active && setError("The avatar is unavailable right now."));
    return () => {
      active = false;
    };
  }, []);

  const speak = useCallback((text: string) => {
    const handle = handleRef.current;
    if (!handle) {
      queuedRef.current = text;
      return;
    }
    setPending(true);
    handle.speakText(text).catch(() => setPending(false));
  }, []);

  const onReady = useCallback(
    (handle: AiTwinHandle) => {
      handleRef.current = handle;
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued) speak(queued);
    },
    [speak],
  );

  const onStatusChange = useCallback((next: AvatarTtsLipsyncStatus) => {
    setStatus(next);
    if (next === "done" || next === "error") setPending(false);
  }, []);

  const onDelta = useCallback(
    (delta: string) => {
      if (enabled) bufferRef.current += delta;
    },
    [enabled],
  );

  const onEnd = useCallback(
    (completed: boolean) => {
      const text = bufferRef.current.trim();
      bufferRef.current = "";
      if (enabled && completed && text) speak(text);
    },
    [enabled, speak],
  );

  const silence = useCallback(() => {
    bufferRef.current = "";
    queuedRef.current = null;
    setPending(false);
    handleRef.current?.stop();
  }, []);

  const stage = error ? (
    <p className="text-sm text-muted">{error}</p>
  ) : token ? (
    <AiTwinStage
      twinId={twinId}
      voiceId={voiceId}
      authToken={token}
      onReady={onReady}
      onStatusChange={onStatusChange}
      onError={setError}
    />
  ) : (
    <div
      className="aspect-[3/4] h-full max-h-80 animate-pulse rounded-card bg-raise"
      aria-label="Loading the avatar"
    />
  );

  return {
    onDelta,
    onEnd,
    prepare,
    silence,
    isSpeaking: pending || BUSY_STATUSES.includes(status),
    isAudible: status === "speaking",
    stage,
  };
}
