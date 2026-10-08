import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import { z } from "zod";
import { retry } from "@/lib/async/retry";
import { LlmOutputError, type LlmProvider, type ObjectRequest, type ReplyRequest } from "../types";

const MAX_OUTPUT_TOKENS = 16_000;
const BUSY_RETRY_DELAYS_MS = [1_000, 2_500];
const BUSY_STATUSES = new Set([500, 503]);

const isBusy = (error: unknown) => error instanceof ApiError && BUSY_STATUSES.has(error.status);

export function createGeminiProvider(apiKey: string, model: string): LlmProvider {
  const client = new GoogleGenAI({ apiKey });

  return {
    id: "gemini",
    label: "Gemini",
    async *streamReply({ system, messages, signal }: ReplyRequest) {
      const stream = await retry(
        () =>
          client.models.generateContentStream({
            model,
            contents: messages.map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
            config: {
              systemInstruction: system,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
              abortSignal: signal,
            },
          }),
        { delaysMs: BUSY_RETRY_DELAYS_MS, shouldRetry: isBusy, signal },
      );

      for await (const chunk of stream) {
        if (chunk.text) yield chunk.text;
      }
    },

    async generateObject<Schema extends z.ZodType>({
      system,
      prompt,
      schema,
      signal,
    }: ObjectRequest<Schema>) {
      const response = await retry(
        () =>
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: system,
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              responseMimeType: "application/json",
              responseJsonSchema: z.toJSONSchema(schema),
              abortSignal: signal,
            },
          }),
        { delaysMs: BUSY_RETRY_DELAYS_MS, shouldRetry: isBusy, signal },
      );

      try {
        return schema.parse(JSON.parse(response.text ?? "")) as z.infer<Schema>;
      } catch (error) {
        throw new LlmOutputError(error instanceof Error ? error.message : "invalid JSON");
      }
    },
  };
}
