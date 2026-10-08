import { z } from "zod";
import { CASE_FILE_ID_PATTERN } from "@/lib/case-file/id";
import { LLM_PROVIDER_IDS } from "@/lib/llm/types";

const MAX_TURN_CHARACTERS = 20_000;
const MAX_TURNS = 200;

export const gradeRequestSchema = z.object({
  caseFileId: z.string().regex(CASE_FILE_ID_PATTERN),
  studentSide: z.enum(["proposition", "opposition"]),
  level: z.enum(["jc", "secondary"]),
  provider: z.enum(LLM_PROVIDER_IDS),
  turns: z
    .array(
      z.object({
        speaker: z.enum(["student", "ai"]),
        text: z.string().trim().min(1).max(MAX_TURN_CHARACTERS),
        durationMs: z.number().int().nonnegative().optional(),
        spoken: z.boolean().optional(),
      }),
    )
    .max(MAX_TURNS)
    .refine(
      (turns) => turns.some(({ speaker }) => speaker === "student"),
      "The round needs at least one student speech.",
    ),
});

export type GradeRequest = z.infer<typeof gradeRequestSchema>;
