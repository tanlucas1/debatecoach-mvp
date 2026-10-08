import type { z } from "zod";

export const LLM_PROVIDER_IDS = ["claude", "gemini"] as const;

export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number];

export interface LlmProviderOption {
  id: LlmProviderId;
  label: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReplyRequest {
  system: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
}

export interface ObjectRequest<Schema extends z.ZodType> {
  system: string;
  prompt: string;
  schema: Schema;
  signal?: AbortSignal;
}

export interface LlmProvider extends LlmProviderOption {
  streamReply(request: ReplyRequest): AsyncIterable<string>;
  generateObject<Schema extends z.ZodType>(
    request: ObjectRequest<Schema>,
  ): Promise<z.infer<Schema>>;
}

export class LlmRefusalError extends Error {
  constructor() {
    super("The model declined to respond.");
    this.name = "LlmRefusalError";
  }
}

export class LlmOutputError extends Error {
  constructor(detail: string) {
    super(`The model returned an unusable response: ${detail}`);
    this.name = "LlmOutputError";
  }
}
