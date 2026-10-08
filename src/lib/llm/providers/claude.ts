import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import {
  LlmOutputError,
  LlmRefusalError,
  type LlmProvider,
  type ObjectRequest,
  type ReplyRequest,
} from "../types";

const MAX_OUTPUT_TOKENS = 16_000;

export function createClaudeProvider(apiKey: string, model: string): LlmProvider {
  const client = new Anthropic({ apiKey });

  return {
    id: "claude",
    label: "Claude",
    async *streamReply({ system, messages, signal }: ReplyRequest) {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          system,
          messages,
          cache_control: { type: "ephemeral" },
          thinking: { type: "adaptive" },
          output_config: { effort: "medium" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        },
        { signal },
      );

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }

      const message = await stream.finalMessage();
      if (message.stop_reason === "refusal") throw new LlmRefusalError();
    },

    async generateObject<Schema extends z.ZodType>({
      system,
      prompt,
      schema,
      signal,
    }: ObjectRequest<Schema>) {
      const stream = client.messages.stream(
        {
          model,
          max_tokens: MAX_OUTPUT_TOKENS,
          system,
          messages: [{ role: "user", content: prompt }],
          thinking: { type: "adaptive" },
          output_config: { effort: "high", format: zodOutputFormat(schema) },
        },
        { signal },
      );

      const message = await stream.finalMessage();
      if (message.stop_reason === "refusal") throw new LlmRefusalError();
      if (message.parsed_output == null) {
        throw new LlmOutputError(`stop reason ${message.stop_reason}`);
      }
      return message.parsed_output as z.infer<Schema>;
    },
  };
}
