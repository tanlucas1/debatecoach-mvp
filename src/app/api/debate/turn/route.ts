import { z } from "zod";
import { CaseFileNotFoundError, loadCaseFile } from "@/lib/case-file";
import { buildOpponentPrompt, toChatMessages, turnRequestSchema } from "@/lib/debate";
import { aiTurnWords } from "@/lib/debate/turn-length";
import { getLlmProvider, LlmRefusalError } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const parsed = turnRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request.", details: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const { caseFileId, studentSide, level, provider: providerId, turns } = parsed.data;

  const provider = getLlmProvider(providerId);
  if (!provider) {
    return Response.json({ error: `Model "${providerId}" is not configured.` }, { status: 400 });
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

  const reply = provider
    .streamReply({
      system: buildOpponentPrompt(result.caseFile, {
        studentSide,
        level,
        targetWords: aiTurnWords(level),
      }),
      messages: toChatMessages(turns),
      signal: request.signal,
    })
    [Symbol.asyncIterator]();

  let first: IteratorResult<string>;
  try {
    first = await reply.next();
  } catch (error) {
    return Response.json(replyErrorBody(error, provider.label), { status: 502 });
  }

  return new Response(toTextStream(reply, first), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function replyErrorBody(error: unknown, providerLabel: string) {
  if (error instanceof LlmRefusalError) return { error: error.message };
  console.error(`${providerLabel} reply failed`, error);
  return {
    error: `${providerLabel} is busy or unavailable right now. Try again, or switch model.`,
  };
}

function toTextStream(
  iterator: AsyncIterator<string>,
  first: IteratorResult<string>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let pending: IteratorResult<string> | null = first;

  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = pending ?? (await iterator.next());
        pending = null;
        if (done) controller.close();
        else controller.enqueue(encoder.encode(value));
      } catch (error) {
        if (!(error instanceof LlmRefusalError)) console.error("AI reply stream failed", error);
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}
