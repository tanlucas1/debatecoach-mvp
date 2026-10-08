import { env } from "@/lib/env";
import { AvatarNotConfiguredError, AvatarServiceError } from "./errors";

const API_BASE = "https://api.anam.ai/v1";
const SESSION_TOKEN_ENDPOINT = `${API_BASE}/auth/session-token`;
const MAX_SESSION_SECONDS = 30 * 60;
// Anam's own LLM stays off, so the persona only speaks the replies the app sends it.
const CLIENT_SIDE_LLM = "CUSTOMER_CLIENT_V1";

export interface AnamSession {
  sessionToken: string;
}

export interface AnamPreview {
  idleVideoUrl: string;
}

export const isAnamConfigured = () => Boolean(env.ANAM_API_KEY && env.ANAM_AVATAR_ID);

function credentials(): { apiKey: string; avatarId: string } {
  if (!env.ANAM_API_KEY || !env.ANAM_AVATAR_ID) throw new AvatarNotConfiguredError();
  return { apiKey: env.ANAM_API_KEY, avatarId: env.ANAM_AVATAR_ID };
}

// The avatar's own idle clip plays before a session opens, so showing it costs no minutes.
export async function getAnamPreview(): Promise<AnamPreview> {
  const { apiKey, avatarId } = credentials();
  const response = await fetch(`${API_BASE}/avatars/${encodeURIComponent(avatarId)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body: { idleVideoUrl?: unknown } | null = await response.json().catch(() => null);
  if (!response.ok || typeof body?.idleVideoUrl !== "string") {
    throw new AvatarServiceError("Anam", response.status);
  }
  return { idleVideoUrl: body.idleVideoUrl };
}

export async function createAnamSession(): Promise<AnamSession> {
  const { apiKey, avatarId } = credentials();

  const response = await fetch(SESSION_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      personaConfig: {
        name: "Debate opponent",
        avatarId,
        avatarModel: "cara-4",
        voiceId: env.ANAM_VOICE_ID,
        llmId: CLIENT_SIDE_LLM,
        skipGreeting: true,
        maxSessionLengthSeconds: MAX_SESSION_SECONDS,
      },
    }),
  });
  const body: { sessionToken?: unknown } | null = await response.json().catch(() => null);
  if (!response.ok || typeof body?.sessionToken !== "string") {
    throw new AvatarServiceError("Anam", response.status);
  }
  return { sessionToken: body.sessionToken };
}
