import { z } from "zod";
import { SpeechNotConfiguredError, SpeechServiceError } from "@/lib/speech/deepgram";
import { synthesizeVoice } from "@/lib/speech/synthesize";
import { DEFAULT_VOICE, VOICE_FALLBACK_HEADER, VOICE_IDS } from "@/lib/speech/voices";

export const runtime = "nodejs";

const MAX_TEXT_CHARACTERS = 2_000;

const requestSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TEXT_CHARACTERS),
  voice: z.enum(VOICE_IDS).default(DEFAULT_VOICE),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { text, voice } = parsed.data;
    const { audio, fallback } = await synthesizeVoice(text, voice, request.signal);
    const headers = new Headers({
      "Content-Type": audio.headers.get("Content-Type") ?? "audio/mpeg",
      "Cache-Control": "no-store",
    });
    if (fallback) headers.set(VOICE_FALLBACK_HEADER, fallback);
    return new Response(audio.body, { headers });
  } catch (error) {
    if (error instanceof SpeechNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SpeechServiceError) {
      console.error(error);
      return Response.json({ error: "The AI voice is unavailable right now." }, { status: 502 });
    }
    throw error;
  }
}
