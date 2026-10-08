"use client";

import DailyIframe, {
  type DailyCall,
  type DailyEventObjectAppMessage,
  type DailyEventObjectTrack,
} from "@daily-co/daily-js";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TavusSession } from "@/lib/presenter/tavus";
import { AvatarTile } from "./avatar-tile";
import type { Presenter, PresenterOptions } from "./types";

const SESSION_ENDPOINT = "/api/avatar/tavus";
const END_ENDPOINT = "/api/avatar/tavus/end";

type Phase = "idle" | "connecting" | "ready" | "error";

const PHASE_NOTES: Record<Exclude<Phase, "ready">, string> = {
  idle: "The avatar joins when you start speaking.",
  connecting: "Connecting the avatar…",
  error: "The avatar is unavailable right now.",
};

interface SpeakingEvent {
  event_type?: string;
  properties?: { role?: string };
}

function endSession(session: TavusSession) {
  const body = new Blob([JSON.stringify({ conversationId: session.conversationId })], {
    type: "application/json",
  });
  navigator.sendBeacon(END_ENDPOINT, body);
}

export function useTavusPresenter({ enabled }: PresenterOptions): Presenter {
  const [phase, setPhase] = useState<Phase>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [pending, setPending] = useState(false);
  const callRef = useRef<DailyCall | null>(null);
  const sessionRef = useRef<TavusSession | null>(null);
  const startedRef = useRef(false);
  const disposedRef = useRef(false);
  const readyRef = useRef(false);
  const bufferRef = useRef("");
  const queuedRef = useRef<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const send = useCallback((eventType: string, properties?: Record<string, string>) => {
    const call = callRef.current;
    const session = sessionRef.current;
    if (!call || !session) return;
    call.sendAppMessage(
      {
        message_type: "conversation",
        event_type: eventType,
        conversation_id: session.conversationId,
        ...(properties && { properties }),
      },
      "*",
    );
  }, []);

  const speakNow = useCallback(
    (text: string) => send("conversation.echo", { modality: "text", text }),
    [send],
  );

  const speak = useCallback(
    (text: string) => {
      setPending(true);
      if (readyRef.current) speakNow(text);
      else queuedRef.current = text;
    },
    [speakNow],
  );

  const fail = useCallback(() => {
    queuedRef.current = null;
    setPending(false);
    setPhase("error");
  }, []);

  const release = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    readyRef.current = false;
    const call = callRef.current;
    callRef.current = null;
    if (call) void call.leave().finally(() => call.destroy());
    if (session) endSession(session);
  }, []);

  const onTrack = useCallback(
    (event?: DailyEventObjectTrack) => {
      if (!event?.participant || event.participant.local) return;
      const element = event.track.kind === "video" ? videoRef.current : audioRef.current;
      if (element) {
        element.srcObject = new MediaStream([event.track]);
        void element.play().catch(() => undefined);
      }
      if (event.track.kind !== "video") return;
      readyRef.current = true;
      setPhase("ready");
      const queued = queuedRef.current;
      queuedRef.current = null;
      if (queued) speakNow(queued);
    },
    [speakNow],
  );

  const onAppMessage = useCallback((event?: DailyEventObjectAppMessage) => {
    const data = event?.data as SpeakingEvent | undefined;
    if (data?.properties?.role !== "pal") return;
    if (data.event_type === "conversation.started_speaking") setSpeaking(true);
    else if (data.event_type === "conversation.stopped_speaking") setSpeaking(false);
    else return;
    setPending(false);
  }, []);

  const prepare = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setPhase("connecting");
    void audioRef.current?.play().catch(() => undefined);

    fetch(SESSION_ENDPOINT, { method: "POST" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((session: TavusSession) => {
        if (disposedRef.current) {
          endSession(session);
          return;
        }
        sessionRef.current = session;
        const call = DailyIframe.createCallObject({ audioSource: false, videoSource: false });
        callRef.current = call;
        call.on("track-started", onTrack);
        call.on("app-message", onAppMessage);
        call.on("error", fail);
        return call.join({ url: session.url });
      })
      .catch(fail);
  }, [onTrack, onAppMessage, fail]);

  useEffect(() => {
    disposedRef.current = false;
    window.addEventListener("pagehide", release);
    return () => {
      disposedRef.current = true;
      window.removeEventListener("pagehide", release);
      release();
    };
  }, [release]);

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
    send("conversation.interrupt");
  }, [send]);

  const live = phase === "ready";

  const stage = (
    <AvatarTile
      status={
        live
          ? { label: speaking ? "Speaking" : "Listening", live: true }
          : phase === "connecting"
            ? { label: "Connecting", live: false }
            : undefined
      }
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="size-full object-cover object-[50%_20%]"
      />
      <audio ref={audioRef} autoPlay />
      {!live && (
        <p className="absolute inset-0 grid place-items-center p-3 text-center text-xs text-muted md:text-sm">
          {PHASE_NOTES[phase]}
        </p>
      )}
    </AvatarTile>
  );

  return {
    onDelta,
    onEnd,
    prepare,
    silence,
    isSpeaking: pending || speaking,
    isAudible: speaking,
    stage,
    stageAspect: "aspect-video",
  };
}
