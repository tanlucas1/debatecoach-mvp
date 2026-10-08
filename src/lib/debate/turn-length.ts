import { env } from "@/lib/env";
import type { Level } from "./types";

const AI_TURN_WORDS: Record<Level, number> = {
  jc: env.AI_TURN_WORDS_JC,
  secondary: env.AI_TURN_WORDS_SECONDARY,
};

export const aiTurnWords = (level: Level) => AI_TURN_WORDS[level];
