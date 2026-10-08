"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_VOICE, VOICES, VOICE_IDS, type VoiceId } from "./voices";

const VOICE_STORAGE_KEY = "debate-coach-voice";
const QUOTA_STORAGE_KEY = "debate-coach-voice-quota";
const QUOTA_BLOCK_MS = 12 * 60 * 60 * 1000;
const SEPARATOR = "|";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The choice still applies for this visit when storage is blocked.
  }
  listeners.forEach((listener) => listener());
}

function readSnapshot(): string {
  try {
    const voice = localStorage.getItem(VOICE_STORAGE_KEY) ?? "";
    const blockedAt = Number(localStorage.getItem(QUOTA_STORAGE_KEY) ?? 0);
    const premiumBlocked = Date.now() - blockedAt < QUOTA_BLOCK_MS;
    return [voice, premiumBlocked].join(SEPARATOR);
  } catch {
    return SEPARATOR;
  }
}

const serverSnapshot = ["", false].join(SEPARATOR);

const isVoiceId = (value: string): value is VoiceId => VOICE_IDS.some((id) => id === value);

export function useVoice(configured: readonly VoiceId[]) {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => serverSnapshot);
  const [stored, blocked] = snapshot.split(SEPARATOR);

  const voices = configured.filter(
    (id) => !(blocked === "true" && VOICES[id].provider === "elevenlabs"),
  );
  const preferred = isVoiceId(stored) ? stored : DEFAULT_VOICE;
  const voice = voices.includes(preferred) ? preferred : voices[0];

  const selectVoice = useCallback((next: VoiceId) => write(VOICE_STORAGE_KEY, next), []);
  const markPremiumUnavailable = useCallback(
    () => write(QUOTA_STORAGE_KEY, String(Date.now())),
    [],
  );

  return { voice, voices, selectVoice, markPremiumUnavailable };
}
