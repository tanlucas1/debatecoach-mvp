"use client";

import { useCallback, useRef } from "react";
import { takeSpeakableChunks } from "@/lib/speech/chunking";
import { useSpeechPlayback, type PlaybackOptions } from "./use-speech-playback";

export function useSpokenReply(enabled: boolean, options?: PlaybackOptions) {
  const playback = useSpeechPlayback(options);
  const bufferRef = useRef("");
  const { enqueue, stop } = playback;

  const onDelta = useCallback(
    (delta: string) => {
      if (!enabled) return;
      const { chunks, rest } = takeSpeakableChunks(bufferRef.current + delta);
      bufferRef.current = rest;
      chunks.forEach(enqueue);
    },
    [enabled, enqueue],
  );

  const onEnd = useCallback(
    (completed: boolean) => {
      const rest = bufferRef.current.trim();
      bufferRef.current = "";
      if (enabled && completed && rest) enqueue(rest);
    },
    [enabled, enqueue],
  );

  const silence = useCallback(() => {
    bufferRef.current = "";
    stop();
  }, [stop]);

  return {
    onDelta,
    onEnd,
    silence,
    isSpeaking: playback.isSpeaking,
  };
}
