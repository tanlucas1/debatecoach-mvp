import type { ChatMessage } from "@/lib/llm/types";
import { FIRST_SPEAKER } from "./config";
import type { Speaker, Turn } from "./types";

export const OPENING_CUE = "(The round has started. Deliver your opening speech.)";

export function isAiTurnNext(turns: Turn[]): boolean {
  const expected = (index: number): Speaker =>
    (index % 2 === 0) === (FIRST_SPEAKER === "student") ? "student" : "ai";

  const alternates = turns.every((turn, index) => turn.speaker === expected(index));
  return alternates && expected(turns.length) === "ai";
}

export function toChatMessages(turns: Turn[]): ChatMessage[] {
  const messages: ChatMessage[] = turns.map((turn) => ({
    role: turn.speaker === "student" ? "user" : "assistant",
    content: turn.text,
  }));

  if (messages[0]?.role !== "user") messages.unshift({ role: "user", content: OPENING_CUE });
  return messages;
}
