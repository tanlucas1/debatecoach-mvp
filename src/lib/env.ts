import { z } from "zod";
import { LLM_PROVIDER_IDS } from "@/lib/llm/types";
import { PRESENTER_IDS } from "@/lib/presenter/types";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

// Cole, a clear US male voice from Anam's library.
const ANAM_DEFAULT_VOICE = "8ebf24c3-4fc0-11f1-84b0-52bacf74fa75";

const optionalString = z.preprocess(blankToUndefined, z.string().trim().optional());

const turnWords = (fallback: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().min(20).max(1000).default(fallback));

const envSchema = z.object({
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_MODEL: z.string().trim().min(1).default("claude-opus-5"),
  GEMINI_API_KEY: optionalString,
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.8-flash"),
  DEEPGRAM_API_KEY: optionalString,
  DEEPGRAM_STT_MODEL: z.string().trim().min(1).default("nova-3"),
  DEEPGRAM_TTS_MODEL: z.string().trim().min(1).default("aura-2-thalia-en"),
  ELEVENLABS_API_KEY: optionalString,
  ELEVENLABS_MODEL: z.string().trim().min(1).default("eleven_v3_conversational"),
  AI_TURN_WORDS_JC: turnWords(100),
  AI_TURN_WORDS_SECONDARY: turnWords(75),
  GRADING_PROVIDER: z.preprocess(blankToUndefined, z.enum(LLM_PROVIDER_IDS).optional()),
  DEFAULT_PROVIDER: z.preprocess(blankToUndefined, z.enum(LLM_PROVIDER_IDS).default("gemini")),
  AVATAR_PROVIDER: z.preprocess(blankToUndefined, z.enum(PRESENTER_IDS).default("anam")),
  ANAM_API_KEY: optionalString,
  ANAM_AVATAR_ID: optionalString,
  ANAM_VOICE_ID: z.preprocess(blankToUndefined, z.string().trim().default(ANAM_DEFAULT_VOICE)),
  AITWIN_ID: optionalString,
  AITWIN_SECRET: optionalString,
  AITWIN_TWIN_ID: optionalString,
  AITWIN_VOICE: optionalString,
  TAVUS_API_KEY: optionalString,
  TAVUS_PAL_ID: optionalString,
});

export const env = envSchema.parse(process.env);
