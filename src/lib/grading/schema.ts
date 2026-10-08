import { z } from "zod";

export const ENGAGEMENTS = ["clash", "restating", "new-argument", "question"] as const;

export type Engagement = (typeof ENGAGEMENTS)[number];

export const gradingAnalysisSchema = z.object({
  aiArguments: z.array(
    z.object({
      aiSpeech: z.number().int().describe("Number of the AI speech that first made the argument."),
      summary: z.string().describe("The argument in one short sentence."),
      central: z
        .boolean()
        .describe("Whether the argument was central to how the round was decided."),
      status: z.enum(["answered", "partly-answered", "dropped"]),
      answeredInSpeech: z
        .number()
        .int()
        .nullable()
        .describe("Student speech that answered it, or null if it was dropped."),
    }),
  ),
  studentSpeeches: z.array(
    z.object({
      speech: z.number().int(),
      engagement: z.enum(ENGAGEMENTS),
      explanation: z.string().describe("One sentence on why, addressed to the student as you."),
    }),
  ),
  evidenceUsed: z.array(
    z.object({
      evidenceId: z.string().describe("Evidence bank id such as E4."),
      speech: z.number().int(),
      studentWords: z.string().describe("The student's words that used the evidence."),
    }),
  ),
  verdict: z.object({
    summary: z.string().describe("At most two short sentences on how the round went."),
    strengths: z.array(z.string().describe("One sentence, at most 20 words.")),
    improvements: z.array(z.string().describe("One sentence, at most 20 words.")),
  }),
});

export type GradingAnalysis = z.infer<typeof gradingAnalysisSchema>;
