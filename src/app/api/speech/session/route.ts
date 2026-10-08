import { z } from "zod";
import { CaseFileNotFoundError, loadCaseFile } from "@/lib/case-file";
import {
  SpeechNotConfiguredError,
  SpeechServiceError,
  createListenSession,
} from "@/lib/speech/deepgram";
import { caseFileKeyterms } from "@/lib/speech/keyterms";

export const runtime = "nodejs";

const requestSchema = z.object({ caseFileId: z.string().regex(/^[\w-]+$/) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  try {
    const result = await loadCaseFile(parsed.data.caseFileId);
    const keyterms = result.ok ? caseFileKeyterms(result.caseFile) : [];
    return Response.json(await createListenSession(keyterms), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof CaseFileNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof SpeechNotConfiguredError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof SpeechServiceError) {
      console.error(error);
      return Response.json(
        { error: "Speech recognition is unavailable right now." },
        { status: 502 },
      );
    }
    throw error;
  }
}
