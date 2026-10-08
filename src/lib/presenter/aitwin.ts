import { env } from "@/lib/env";
import { isAiTwinFaceId } from "./aitwin-face";
import { AvatarNotConfiguredError, AvatarServiceError } from "./errors";

const TOKEN_ENDPOINT = "https://us-central1-streamoji-265f4.cloudfunctions.net/getAiTwinAuthToken";

// Custom faces come with no voice of their own, and the SDK would fall back to a premium one.
const STANDARD_VOICE = "visemetts:rex";

export const isAiTwinConfigured = () =>
  Boolean(env.AITWIN_ID && env.AITWIN_SECRET && env.AITWIN_TWIN_ID);

export function aiTwinVoice(): string | undefined {
  if (env.AITWIN_VOICE) return env.AITWIN_VOICE;
  return env.AITWIN_TWIN_ID && isAiTwinFaceId(env.AITWIN_TWIN_ID) ? STANDARD_VOICE : undefined;
}

export async function createAiTwinToken(): Promise<string> {
  if (!env.AITWIN_ID || !env.AITWIN_SECRET) throw new AvatarNotConfiguredError();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": env.AITWIN_ID,
      "Client-Secret": env.AITWIN_SECRET,
    },
    body: JSON.stringify({ userId: "debate-coach-student", userName: "Student" }),
  });
  const body: { authToken?: unknown } | null = await response.json().catch(() => null);
  if (!response.ok || typeof body?.authToken !== "string") {
    throw new AvatarServiceError("AI Twin", response.status);
  }
  return body.authToken;
}
