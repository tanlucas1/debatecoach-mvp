import { isSpeechConfigured, synthesizeSpeech } from "./deepgram";
import { VoiceQuotaError, isElevenLabsConfigured, synthesizeElevenLabs } from "./elevenlabs";
import { ELEVENLABS_VOICE_IDS, VOICES, VOICE_IDS, type VoiceId } from "./voices";

export type VoiceFallback = "quota" | "error";

interface SynthesizedVoice {
  audio: Response;
  fallback: VoiceFallback | null;
}

export function listAvailableVoices(): VoiceId[] {
  if (!isSpeechConfigured()) return [];
  return VOICE_IDS.filter(
    (voice) => VOICES[voice].provider === "deepgram" || isElevenLabsConfigured(),
  );
}

export function synthesizeWithProvider(
  text: string,
  voice: VoiceId,
  signal?: AbortSignal,
): Promise<Response> {
  const elevenLabsVoice = ELEVENLABS_VOICE_IDS[voice];
  return elevenLabsVoice
    ? synthesizeElevenLabs(text, elevenLabsVoice, signal)
    : synthesizeSpeech(text, { signal });
}

export async function synthesizeVoice(
  text: string,
  voice: VoiceId,
  signal?: AbortSignal,
): Promise<SynthesizedVoice> {
  const elevenLabsVoice = ELEVENLABS_VOICE_IDS[voice];
  let fallback: VoiceFallback | null = null;

  if (elevenLabsVoice && isElevenLabsConfigured()) {
    try {
      return { audio: await synthesizeElevenLabs(text, elevenLabsVoice, signal), fallback };
    } catch (error) {
      if (signal?.aborted) throw error;
      fallback = error instanceof VoiceQuotaError ? "quota" : "error";
      console.error(error);
    }
  }

  return { audio: await synthesizeSpeech(text, { signal }), fallback };
}
