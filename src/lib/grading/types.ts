import type { EvidenceItem } from "@/lib/case-file/types";
import type { Level } from "@/lib/debate/types";
import type { Engagement } from "./schema";

export interface UnansweredArgument {
  aiSpeech: number;
  summary: string;
  central: boolean;
}

export interface SpeechFeedback {
  speech: number;
  engagement: Engagement;
  explanation: string;
  words: number;
  durationMs: number | null;
  wordsPerMinute: number | null;
}

export interface EvidenceUse extends Pick<EvidenceItem, "id" | "fact" | "source"> {
  speech: number;
  studentWords: string;
}

export interface GradingReport {
  level: Level;
  gradedBy: string;
  unanswered: UnansweredArgument[];
  argumentsFaced: number;
  speeches: SpeechFeedback[];
  clash: { count: number; eligible: number };
  evidence: EvidenceUse[];
  delivery: { averageTurnMs: number | null; averageWordsPerMinute: number | null };
  verdict: { summary: string; strengths: string[]; improvements: string[] };
}
