import { wait } from "@/lib/async/limit";
import { env } from "@/lib/env";
import { SpeechServiceError } from "./deepgram";
import { normalizeForSpeech } from "./normalize";

const API_BASE_URL = "https://api.elevenlabs.io/v1";
const OUTPUT_FORMAT = "mp3_44100_128";

export class VoiceQuotaError extends Error {
  constructor() {
    super("The ElevenLabs credit has run out.");
    this.name = "VoiceQuotaError";
  }
}

export const isElevenLabsConfigured = () => Boolean(env.ELEVENLABS_API_KEY);

const BUSY_STATUS = 429;
const BUSY_RETRIES = 2;
const BUSY_RETRY_MS = 400;

async function errorDetail(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  const detail = body && typeof body === "object" && "detail" in body ? body.detail : null;
  return JSON.stringify(detail ?? "");
}

export async function synthesizeElevenLabs(
  text: string,
  voiceId: string,
  signal?: AbortSignal,
): Promise<Response> {
  if (!env.ELEVENLABS_API_KEY) throw new SpeechServiceError("ElevenLabs configuration", 503);

  const params = new URLSearchParams({ output_format: OUTPUT_FORMAT });
  const request = {
    method: "POST",
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text: normalizeForSpeech(text), model_id: env.ELEVENLABS_MODEL }),
    signal,
  };

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch(
      `${API_BASE_URL}/text-to-speech/${voiceId}/stream?${params}`,
      request,
    );
    if (response.ok && response.body) return response;

    if ((await errorDetail(response)).includes("quota_exceeded")) throw new VoiceQuotaError();
    if (response.status !== BUSY_STATUS || attempt === BUSY_RETRIES) {
      throw new SpeechServiceError("ElevenLabs speech synthesis", response.status);
    }
    await wait(BUSY_RETRY_MS * (attempt + 1));
  }
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
}

export function wordStartTimes({ characters, character_start_times_seconds }: Alignment) {
  return characters.flatMap((character, index) =>
    character.trim() && !characters[index - 1]?.trim()
      ? [character_start_times_seconds[index]]
      : [],
  );
}

export async function synthesizeElevenLabsWithTimings(text: string, voiceId: string) {
  if (!env.ELEVENLABS_API_KEY) throw new SpeechServiceError("ElevenLabs configuration", 503);

  const params = new URLSearchParams({ output_format: OUTPUT_FORMAT });
  const response = await fetch(
    `${API_BASE_URL}/text-to-speech/${voiceId}/with-timestamps?${params}`,
    {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text: normalizeForSpeech(text), model_id: env.ELEVENLABS_MODEL }),
    },
  );
  if (!response.ok) throw new SpeechServiceError("ElevenLabs timed speech", response.status);

  const body = (await response.json()) as { audio_base64: string; alignment: Alignment };
  return {
    audio: Buffer.from(body.audio_base64, "base64"),
    wordStarts: wordStartTimes(body.alignment),
  };
}
