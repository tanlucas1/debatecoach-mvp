import { env } from "@/lib/env";
import { createClaudeProvider } from "./providers/claude";
import { createGeminiProvider } from "./providers/gemini";
import type { LlmProvider, LlmProviderId, LlmProviderOption } from "./types";

function createProviders(): Map<LlmProviderId, LlmProvider> {
  const providers = new Map<LlmProviderId, LlmProvider>();

  if (env.ANTHROPIC_API_KEY) {
    providers.set("claude", createClaudeProvider(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL));
  }
  if (env.GEMINI_API_KEY) {
    providers.set("gemini", createGeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL));
  }
  return providers;
}

const providers = createProviders();

export function getLlmProvider(id: LlmProviderId): LlmProvider | undefined {
  return providers.get(id);
}

export function getGradingProvider(preferred: LlmProviderId): LlmProvider | undefined {
  for (const id of [env.GRADING_PROVIDER, preferred, ...providers.keys()]) {
    const provider = id && providers.get(id);
    if (provider) return provider;
  }
  return undefined;
}

export function listLlmProviders(): LlmProviderOption[] {
  return [...providers.values()].map(({ id, label }) => ({ id, label }));
}

export function getDefaultProviderId(): LlmProviderId | undefined {
  return providers.has(env.DEFAULT_PROVIDER) ? env.DEFAULT_PROVIDER : providers.keys().next().value;
}
