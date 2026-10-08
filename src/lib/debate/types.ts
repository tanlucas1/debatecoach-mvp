import type { Side } from "@/lib/case-file/types";
import type { LlmProviderId } from "@/lib/llm/types";

export type Level = "jc" | "secondary";

export type Speaker = "student" | "ai";

export interface Turn {
  speaker: Speaker;
  text: string;
  durationMs?: number;
  spoken?: boolean;
}

export interface DebateSettings {
  caseFileId: string;
  studentSide: Side;
  level: Level;
}

export interface RoundRequest extends DebateSettings {
  provider: LlmProviderId;
  turns: Turn[];
}
