import { z } from "zod";
import { CASE_FILE_ID_PATTERN } from "@/lib/case-file/id";
import { LLM_PROVIDER_IDS } from "@/lib/llm/types";
import { isAiTurnNext } from "./messages";

const MAX_TURN_CHARACTERS = 20_000;
const MAX_TURNS = 200;

export const turnRequestSchema = z.object({
  caseFileId: z.string().regex(CASE_FILE_ID_PATTERN),
  studentSide: z.enum(["proposition", "opposition"]),
  level: z.enum(["jc", "secondary"]),
  provider: z.enum(LLM_PROVIDER_IDS),
  turns: z
    .array(
      z.object({
        speaker: z.enum(["student", "ai"]),
        text: z.string().trim().min(1).max(MAX_TURN_CHARACTERS),
      }),
    )
    .max(MAX_TURNS)
    .refine(isAiTurnNext, "Turns must alternate and it must be the AI's turn to speak."),
});

export type TurnRequest = z.infer<typeof turnRequestSchema>;
