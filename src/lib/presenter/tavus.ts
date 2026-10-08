import { env } from "@/lib/env";
import { AvatarNotConfiguredError, AvatarServiceError } from "./errors";

const CONVERSATIONS_ENDPOINT = "https://tavusapi.com/v2/conversations";
const MAX_CALL_SECONDS = 30 * 60;
const LEFT_TIMEOUT_SECONDS = 10;
const ABSENT_TIMEOUT_SECONDS = 60;

export const TAVUS_CONVERSATION_ID = /^[a-z0-9]+$/i;

export interface TavusSession {
  conversationId: string;
  url: string;
}

export const isTavusConfigured = () => Boolean(env.TAVUS_API_KEY && env.TAVUS_PAL_ID);

function apiKey(): string {
  if (!env.TAVUS_API_KEY || !env.TAVUS_PAL_ID) throw new AvatarNotConfiguredError();
  return env.TAVUS_API_KEY;
}

export async function createTavusConversation(): Promise<TavusSession> {
  const response = await fetch(CONVERSATIONS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey() },
    body: JSON.stringify({
      pal_id: env.TAVUS_PAL_ID,
      conversation_name: "Debate Coach round",
      properties: {
        max_call_duration: MAX_CALL_SECONDS,
        participant_left_timeout: LEFT_TIMEOUT_SECONDS,
        participant_absent_timeout: ABSENT_TIMEOUT_SECONDS,
      },
    }),
  });
  const body: { conversation_id?: unknown; conversation_url?: unknown } | null = await response
    .json()
    .catch(() => null);
  if (
    !response.ok ||
    typeof body?.conversation_id !== "string" ||
    typeof body.conversation_url !== "string"
  ) {
    throw new AvatarServiceError("Tavus", response.status);
  }
  return { conversationId: body.conversation_id, url: body.conversation_url };
}

export async function endTavusConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${CONVERSATIONS_ENDPOINT}/${conversationId}/end`, {
    method: "POST",
    headers: { "x-api-key": apiKey() },
  });
  if (!response.ok) throw new AvatarServiceError("Tavus", response.status);
}
