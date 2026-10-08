import { env } from "@/lib/env";
import { normalizeForSpeech } from "./normalize";
import type { ListenSession } from "./types";

const API_BASE_URL = "https://api.deepgram.com/v1";
const LISTEN_URL = "wss://api.deepgram.com/v1/listen";
const TOKEN_TTL_SECONDS = 60;

export class SpeechNotConfiguredError extends Error {
  constructor() {
    super("Speech is not configured. Add DEEPGRAM_API_KEY to the environment.");
    this.name = "SpeechNotConfiguredError";
  }
}

export class SpeechServiceError extends Error {
  constructor(operation: string, status: number) {
    super(`Deepgram ${operation} failed with status ${status}.`);
    this.name = "SpeechServiceError";
  }
}

export const isSpeechConfigured = () => Boolean(env.DEEPGRAM_API_KEY);

function authHeaders(): HeadersInit {
  if (!env.DEEPGRAM_API_KEY) throw new SpeechNotConfiguredError();
  return { Authorization: `Token ${env.DEEPGRAM_API_KEY}`, "Content-Type": "application/json" };
}

export async function createListenSession(keyterms: string[]): Promise<ListenSession> {
  const response = await fetch(`${API_BASE_URL}/auth/grant`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
  });
  if (!response.ok) throw new SpeechServiceError("token request", response.status);

  const { access_token: token } = (await response.json()) as { access_token: string };

  const params = new URLSearchParams({
    model: env.DEEPGRAM_STT_MODEL,
    language: "en",
    smart_format: "true",
    interim_results: "true",
    endpointing: "false",
  });
  keyterms.forEach((term) => params.append("keyterm", term));

  return { token, url: `${LISTEN_URL}?${params}` };
}

export async function synthesizeSpeech(
  text: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<Response> {
  const params = new URLSearchParams({ model: env.DEEPGRAM_TTS_MODEL, encoding: "mp3" });
  const response = await fetch(`${API_BASE_URL}/speak?${params}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text: normalizeForSpeech(text) }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new SpeechServiceError("speech synthesis", response.status);
  }
  return response;
}
