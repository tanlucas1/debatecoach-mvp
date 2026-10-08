"use client";

import { useSpokenReply } from "@/components/speech/use-spoken-reply";
import type { Presenter, PresenterOptions } from "./types";

const prepare = () => {};

export function useVoicePresenter({ enabled, ...playback }: PresenterOptions): Presenter {
  const spoken = useSpokenReply(enabled, playback);
  return { ...spoken, prepare, isAudible: spoken.isSpeaking, stage: null };
}
