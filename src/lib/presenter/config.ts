import { env } from "@/lib/env";
import { aiTwinVoice, isAiTwinConfigured } from "./aitwin";
import { isAnamConfigured } from "./anam";
import { isTavusConfigured } from "./tavus";
import type { PresenterConfig } from "./types";

function configuredAvatars(): PresenterConfig[] {
  const avatars: PresenterConfig[] = [];
  if (isAnamConfigured()) avatars.push({ id: "anam" });
  if (isAiTwinConfigured() && env.AITWIN_TWIN_ID) {
    avatars.push({ id: "aitwin", twinId: env.AITWIN_TWIN_ID, voiceId: aiTwinVoice() });
  }
  if (isTavusConfigured()) avatars.push({ id: "tavus" });
  return avatars;
}

export function getPresenterOptions(): PresenterConfig[] {
  return env.AVATAR_PROVIDER === "voice" ? [] : configuredAvatars();
}

export function getPresenterConfig(): PresenterConfig {
  if (env.AVATAR_PROVIDER === "voice") return { id: "voice" };
  const avatars = configuredAvatars();
  return avatars.find(({ id }) => id === env.AVATAR_PROVIDER) ?? avatars[0] ?? { id: "voice" };
}
