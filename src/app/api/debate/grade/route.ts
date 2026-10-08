import { z } from "zod";
import { CaseFileNotFoundError, loadCaseFile } from "@/lib/case-file";
import {
  buildGradingReport,
  buildGradingSystemPrompt,
  buildTranscriptPrompt,
  gradeRequestSchema,
  gradingAnalysisSchema,
} from "@/lib/grading";
import { getGradingProvider, LlmRefusalError } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const parsed = gradeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { caseFileId, studentSide, level, provider: providerId, turns } = parsed.data;

  const grader = getGradingProvider(providerId);
  if (!grader) {
    return Response.json(
      { error: "No AI model is available to grade the round." },
      { status: 503 },
    );
  }

  let result;
  try {
    result = await loadCaseFile(caseFileId);
  } catch (error) {
    if (error instanceof CaseFileNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
  if (!result.ok) {
    return Response.json(
      { error: "The case file is invalid.", issues: result.issues },
      { status: 422 },
    );
  }

  try {
    const analysis = await grader.generateObject({
      system: buildGradingSystemPrompt(result.caseFile, { studentSide, level }),
      prompt: buildTranscriptPrompt(turns),
      schema: gradingAnalysisSchema,
      signal: request.signal,
    });

    return Response.json(
      buildGradingReport(analysis, {
        caseFile: result.caseFile,
        turns,
        level,
        gradedBy: grader.label,
      }),
    );
  } catch (error) {
    if (error instanceof LlmRefusalError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    console.error(`${grader.label} grading failed`, error);
    return Response.json(
      { error: `${grader.label} could not grade the round right now. Try again.` },
      { status: 502 },
    );
  }
}
