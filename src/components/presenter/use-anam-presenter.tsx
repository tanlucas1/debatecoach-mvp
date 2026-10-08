"use client";

import {
  AnamEvent,
  createClient,
  MessageRole,
  type AnamClient,
  type MessageStreamEvent,
} from "@anam-ai/js-sdk";
import { clsx } from "clsx";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AnamPreview, AnamSession } from "@/lib/presenter/anam";
import { AvatarTile } from "./avatar-tile";
import type { Presenter, PresenterOptions } from "./types";
import { useVoicePresenter } from "./use-voice-presenter";

const SESSION_ENDPOINT = "/api/avatar/anam";
const PREVIEW_ENDPOINT = "/api/avatar/anam/preview";
const BUSY_NOTE = "The avatar is busy right now, so replies are voice only.";

type Phase = "idle" | "connecting" | "ready" | "error";

export function useAnamPresenter({ enabled, ...playback }: PresenterOptions): Presenter {
  const [phase, setPhase] = useState<Phase>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [pending, setPending] = useState(false);
  const failed = phase === "error";
  // When Anam can't take the session (for example, the plan's limit on sessions at once is
  // reached), the round carries on with the spoken voice instead.
  const voice = useVoicePresenter({ enabled: enabled && failed, ...playback });
  const clientRef = useRef<AnamClient | null>(null);
  const startedRef = useRef(false);
  const disposedRef = useRef(false);
  const readyRef = useRef(false);
  const failedRef = useRef(false);
  const bufferRef = useRef("");
  const queuedRef = useRef<string | null>(null);
  const fallbackRef = useRef<string | null>(null);
  const videoId = useId();
  const [idleVideoUrl, setIdleVideoUrl] = useState<string>();

  useEffect(() => {
    let active = true;
    fetch(PREVIEW_ENDPOINT)
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((preview: AnamPreview) => active && setIdleVideoUrl(preview.idleVideoUrl))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const fail = useCallback(() => {
    if (failedRef.current) return;
    failedRef.current = true;
    readyRef.current = false;
    fallbackRef.current = queuedRef.current;
    queuedRef.current = null;
    setPending(false);
    setSpeaking(false);
    setPhase("error");
  }, []);

  const speakNow = useCallback(
    (client: AnamClient, text: string) => {
      void client.talk(text).catch(() => {
        queuedRef.current = text;
        fail();
      });
    },
    [fail],
  );

  const release = useCallback(() => {
    readyRef.current = false;
    const client = clientRef.current;
    clientRef.current = null;
    if (client) void client.stopStreaming().catch(() => undefined);
  }, []);

  const onReady = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    readyRef.current = true;
    setPhase("ready");
    const queued = queuedRef.current;
    queuedRef.current = null;
    if (queued) speakNow(client, queued);
  }, [speakNow]);

  const onMessage = useCallback((event: MessageStreamEvent) => {
    if (event.role !== MessageRole.PERSONA) return;
    setSpeaking(!event.endOfSpeech && !event.interrupted);
    setPending(false);
  }, []);

  const prepare = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("connecting");

    fetch(SESSION_ENDPOINT, { method: "POST" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then(({ sessionToken }: AnamSession) => {
        if (disposedRef.current) return;
        const client = createClient(sessionToken, { disableInputAudio: true });
        clientRef.current = client;
        client.addListener(AnamEvent.SESSION_READY, onReady);
        client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, onMessage);
        client.addListener(AnamEvent.CONNECTION_CLOSED, () => {
          if (!disposedRef.current) fail();
        });
        return client.streamToVideoElement(videoId);
      })
      .catch(fail);
  }, [videoId, onReady, onMessage, fail]);

  useEffect(() => {
    disposedRef.current = false;
    window.addEventListener("pagehide", release);
    return () => {
      disposedRef.current = true;
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [release]);

  const { onDelta: voiceDelta, onEnd: voiceEnd, silence: voiceSilence } = voice;

  // A reply that was waiting for the avatar when it failed is spoken by the voice instead.
  useEffect(() => {
    const text = fallbackRef.current;
    if (!failed || !text) return;
    fallbackRef.current = null;
    voiceDelta(text);
    voiceEnd(true);
  }, [failed, voiceDelta, voiceEnd]);

  const speak = useCallback(
    (text: string) => {
      const client = clientRef.current;
      setPending(true);
      if (client && readyRef.current) speakNow(client, text);
      else queuedRef.current = text;
    },
    [speakNow],
  );

  const onDelta = useCallback(
    (delta: string) => {
      if (failedRef.current) voiceDelta(delta);
      else if (enabled) bufferRef.current += delta;
    },
    [enabled, voiceDelta],
  );

  const onEnd = useCallback(
    (completed: boolean) => {
      if (failedRef.current) {
        voiceEnd(completed);
        return;
      }
      const text = bufferRef.current.trim();
      bufferRef.current = "";
      if (enabled && completed && text) speak(text);
    },
    [enabled, speak, voiceEnd],
  );

  const silence = useCallback(() => {
    bufferRef.current = "";
    queuedRef.current = null;
    setPending(false);
    setSpeaking(false);
    if (readyRef.current) clientRef.current?.interruptPersona();
    voiceSilence();
  }, [voiceSilence]);

  const live = phase === "ready";
  const status =
    phase === "connecting"
      ? { label: "Connecting", live: false }
      : live
        ? { label: speaking ? "Speaking" : "Listening", live: true }
        : failed
          ? { label: "Voice only", live: false }
          : undefined;
  const idleClip = (className: string) =>
    idleVideoUrl && (
      <video src={idleVideoUrl} autoPlay loop muted playsInline className={className} />
    );

  const stage = (
    <AvatarTile status={status} note={failed ? BUSY_NOTE : undefined}>
      {/* The idle clip covers the wait until the live stream is up, at no cost in minutes. */}
      {!live && idleClip("absolute inset-0 size-full object-cover object-[50%_20%]")}
      {/* Anam sends its voice on the video stream, so the video must not be muted. */}
      <video
        id={videoId}
        autoPlay
        playsInline
        className={clsx(
          "absolute inset-0 size-full object-cover object-[50%_20%] transition-opacity duration-500",
          !live && "opacity-0",
        )}
      />
    </AvatarTile>
  );

  return {
    onDelta,
    onEnd,
    prepare,
    silence,
    isSpeaking: pending || speaking || voice.isSpeaking,
    isAudible: speaking || voice.isSpeaking,
    stage,
    stageAspect: "aspect-[3/2]",
  };
}
