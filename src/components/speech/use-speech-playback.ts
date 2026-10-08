"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createLimiter } from "@/lib/async/limit";
import { VOICE_FALLBACK_HEADER, type VoiceId } from "@/lib/speech/voices";

const SPEAK_ENDPOINT = "/api/speech/speak";
const MAX_PARALLEL_REQUESTS = 2;

export interface PlaybackOptions {
  voice?: VoiceId;
  onPremiumUnavailable?: () => void;
}

interface SpeechResult {
  blob: Blob | null;
  premiumUnavailable: boolean;
}

async function fetchSpeech(text: string, voice: VoiceId | undefined): Promise<SpeechResult> {
  try {
    const response = await fetch(SPEAK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice }),
    });
    return {
      blob: response.ok ? await response.blob() : null,
      premiumUnavailable: response.headers.get(VOICE_FALLBACK_HEADER) === "quota",
    };
  } catch {
    return { blob: null, premiumUnavailable: false };
  }
}

function playBlob(blob: Blob, audio: HTMLAudioElement): Promise<void> {
  const url = URL.createObjectURL(blob);
  audio.src = url;
  return new Promise<void>((resolve) => {
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.onpause = done;
    audio.play().catch(done);
  });
}

export function useSpeechPlayback({ voice, onPremiumUnavailable }: PlaybackOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const optionsRef = useRef<PlaybackOptions>({ voice, onPremiumUnavailable });
  const limitRef = useRef(createLimiter(MAX_PARALLEL_REQUESTS));

  useEffect(() => {
    optionsRef.current = { voice, onPremiumUnavailable };
  }, [voice, onPremiumUnavailable]);
  const queueRef = useRef<Promise<Blob | null>[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const generationRef = useRef(0);
  const drainingRef = useRef(false);

  const drain = useCallback(async (generation: number) => {
    drainingRef.current = true;
    setIsSpeaking(true);
    audioRef.current ??= new Audio();

    while (queueRef.current.length > 0 && generation === generationRef.current) {
      const blob = await queueRef.current.shift();
      if (generation !== generationRef.current) break;
      if (blob) await playBlob(blob, audioRef.current);
    }

    if (generation === generationRef.current) {
      drainingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  const enqueue = useCallback(
    (text: string) => {
      const { voice: current, onPremiumUnavailable: notify } = optionsRef.current;
      const speech = limitRef
        .current(() => fetchSpeech(text, current))
        .then(({ blob, premiumUnavailable }) => {
          if (premiumUnavailable) notify?.();
          return blob;
        });
      queueRef.current.push(speech);
      if (!drainingRef.current) void drain(generationRef.current);
    },
    [drain],
  );

  const stop = useCallback(() => {
    generationRef.current += 1;
    queueRef.current = [];
    drainingRef.current = false;
    audioRef.current?.pause();
    setIsSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  return { enqueue, stop, isSpeaking };
}
