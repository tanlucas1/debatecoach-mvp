"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ListenSession } from "@/lib/speech/types";

export type RecognitionState = "idle" | "starting" | "listening" | "stopping";

const SESSION_ENDPOINT = "/api/speech/session";
const RECORDER_SLICE_MS = 250;
const CONNECT_TIMEOUT_MS = 10_000;
const FINALIZE_TIMEOUT_MS = 2_500;
const MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
const LEVEL_INTERVAL_MS = 80;
const LEVEL_GAIN = 4;
const MAX_RECONNECTS = 2;
const LOST_CONNECTION =
  "Lost connection to speech recognition. Your words so far are kept, tap the mic to carry on.";

interface ActiveSession {
  recorder: MediaRecorder;
  stream: MediaStream;
  socket: WebSocket | null;
  connected: Promise<void>;
  pending: Blob[];
  finals: string[];
  interim: string;
  reconnects: number;
  stopping: boolean;
  onFinalized: (() => void) | null;
  stopMeter: () => void;
}

interface ResultsMessage {
  type: "Results";
  is_final: boolean;
  from_finalize?: boolean;
  channel: { alternatives: { transcript: string }[] };
}

async function requestSession(caseFileId: string): Promise<ListenSession> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseFileId }),
  });
  if (!response.ok) throw new Error("Speech recognition is unavailable right now.");
  return response.json();
}

function describeError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access is blocked. Allow it in the browser to speak.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found.";
  }
  return error instanceof Error ? error.message : "Speech recognition failed.";
}

const joinText = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

const withTimeout = (promise: Promise<unknown>, ms: number) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

function startLevelMeter(stream: MediaStream, onLevel: (level: number) => void): () => void {
  const context = new AudioContext();
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  context.createMediaStreamSource(stream).connect(analyser);
  const samples = new Uint8Array(analyser.fftSize);

  const id = setInterval(() => {
    analyser.getByteTimeDomainData(samples);
    const energy = samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0);
    onLevel(Math.min(1, Math.sqrt(energy / samples.length) * LEVEL_GAIN));
  }, LEVEL_INTERVAL_MS);

  return () => {
    clearInterval(id);
    void context.close();
    onLevel(0);
  };
}

function release(session: ActiveSession) {
  session.stopMeter();
  if (session.recorder.state !== "inactive") session.recorder.stop();
  session.stream.getTracks().forEach((track) => track.stop());
  if (session.socket?.readyState === WebSocket.OPEN) {
    session.socket.send(JSON.stringify({ type: "CloseStream" }));
  }
  session.socket?.close();
}

function sendAudio(active: ActiveSession, data: Blob) {
  if (data.size === 0) return;
  if (active.socket?.readyState === WebSocket.OPEN) active.socket.send(data);
  else active.pending.push(data);
}

function startRecorder(stream: MediaStream, onData: (data: Blob) => void): MediaRecorder {
  const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  recorder.ondataavailable = ({ data }) => onData(data);
  recorder.start(RECORDER_SLICE_MS);
  return recorder;
}

export function useSpeechRecognition(caseFileId: string) {
  const [state, setState] = useState<RecognitionState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const sessionRef = useRef<ActiveSession | null>(null);
  const keptRef = useRef("");

  const fail = useCallback((message: string) => {
    const active = sessionRef.current;
    if (active) {
      keptRef.current = joinText(keptRef.current, ...active.finals, active.interim);
      release(active);
    }
    sessionRef.current = null;
    setTranscript(keptRef.current);
    setInterim("");
    setError(message);
    setState("idle");
  }, []);

  const handleMessage = useCallback((active: ActiveSession, raw: string) => {
    const message = JSON.parse(raw) as ResultsMessage | { type: string };
    if (message.type !== "Results") return;
    const result = message as ResultsMessage;
    const text = result.channel.alternatives[0]?.transcript ?? "";

    if (!result.is_final) {
      active.interim = text;
      setInterim(text);
      return;
    }
    active.interim = "";
    if (text) active.finals.push(text);
    setTranscript(active.finals.join(" "));
    setInterim("");
    if (result.from_finalize) active.onFinalized?.();
  }, []);

  const connect = useCallback(
    function connect(active: ActiveSession, session: ListenSession): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(session.url, ["bearer", session.token]);
        active.socket = socket;
        let opened = false;
        socket.onopen = () => {
          opened = true;
          active.reconnects = 0;
          active.pending.splice(0).forEach((chunk) => socket.send(chunk));
          resolve();
        };
        socket.onmessage = ({ data }) => handleMessage(active, data as string);
        socket.onerror = () => {
          if (!opened) reject(new Error("Could not reach speech recognition."));
        };
        socket.onclose = () => {
          if (!opened || active.stopping || sessionRef.current !== active) return;
          if (active.reconnects >= MAX_RECONNECTS) {
            fail(LOST_CONNECTION);
            return;
          }
          active.reconnects += 1;
          if (active.interim) active.finals.push(active.interim);
          active.interim = "";
          setInterim("");
          active.recorder.ondataavailable = null;
          if (active.recorder.state !== "inactive") active.recorder.stop();
          active.pending = [];
          active.recorder = startRecorder(active.stream, (data) => sendAudio(active, data));
          active.connected = requestSession(caseFileId).then((next) => connect(active, next));
          active.connected.catch(() => {
            if (sessionRef.current === active && !active.stopping) fail(LOST_CONNECTION);
          });
        };
      });
    },
    [caseFileId, handleMessage, fail],
  );

  const start = useCallback(async (): Promise<boolean> => {
    if (sessionRef.current) return true;
    setError(null);
    setTranscript("");
    setInterim("");
    setState("starting");

    const sessionRequest = requestSession(caseFileId);
    sessionRequest.catch(() => undefined);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const active: ActiveSession = {
        recorder: startRecorder(stream, (data) => sendAudio(active, data)),
        stream,
        socket: null,
        connected: Promise.resolve(),
        pending: [],
        finals: [],
        interim: "",
        reconnects: 0,
        stopping: false,
        onFinalized: null,
        stopMeter: startLevelMeter(stream, setLevel),
      };
      sessionRef.current = active;
      setState("listening");

      active.connected = sessionRequest.then((session) => connect(active, session));
      await active.connected;
      return true;
    } catch (caught) {
      fail(describeError(caught));
      return false;
    }
  }, [caseFileId, connect, fail]);

  const stop = useCallback(async (): Promise<string> => {
    const kept = keptRef.current;
    keptRef.current = "";
    const active = sessionRef.current;
    if (!active) {
      setTranscript("");
      return kept;
    }
    active.stopping = true;
    setState("stopping");

    if (active.recorder.state !== "inactive") {
      const stopped = new Promise((resolve) =>
        active.recorder.addEventListener("stop", resolve, { once: true }),
      );
      active.recorder.stop();
      await stopped;
    }

    await withTimeout(
      active.connected.catch(() => undefined),
      CONNECT_TIMEOUT_MS,
    );

    if (active.socket?.readyState === WebSocket.OPEN) {
      const finalized = new Promise<void>((resolve) => {
        active.onFinalized = resolve;
      });
      active.socket.send(JSON.stringify({ type: "Finalize" }));
      await withTimeout(finalized, FINALIZE_TIMEOUT_MS);
    }

    release(active);
    sessionRef.current = null;
    setTranscript("");
    setInterim("");
    setState("idle");
    return joinText(kept, ...active.finals);
  }, []);

  useEffect(
    () => () => {
      if (sessionRef.current) release(sessionRef.current);
      sessionRef.current = null;
    },
    [],
  );

  return { state, transcript, interim, error, level, start, stop };
}
