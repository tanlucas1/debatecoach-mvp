export const VOICE_IDS = ["river", "daniel", "alice", "thalia"] as const;

export type VoiceId = (typeof VOICE_IDS)[number];

export type VoiceProvider = "elevenlabs" | "deepgram";

export interface Voice {
  id: VoiceId;
  label: string;
  description: string;
  provider: VoiceProvider;
}

export const VOICES: Record<VoiceId, Voice> = {
  river: {
    id: "river",
    label: "River",
    description: "Calm, neutral accent",
    provider: "elevenlabs",
  },
  daniel: { id: "daniel", label: "Daniel", description: "British, steady", provider: "elevenlabs" },
  alice: { id: "alice", label: "Alice", description: "British, confident", provider: "elevenlabs" },
  thalia: { id: "thalia", label: "Thalia", description: "Standard voice", provider: "deepgram" },
};

export const ELEVENLABS_VOICE_IDS: Partial<Record<VoiceId, string>> = {
  river: "SAz9YHcvj6GT2YYXdXww",
  daniel: "onwK4e9ZLuTAKqWW03F9",
  alice: "Xb7hH8MSUJpSbSDYk0k2",
};

export const DEFAULT_VOICE: VoiceId = "river";

export const VOICE_FALLBACK_HEADER = "X-Voice-Fallback";

export const voicePreviewPath = (voice: VoiceId) => `/voices/${voice}.mp3`;
