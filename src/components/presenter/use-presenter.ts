"use client";

import type { PresenterConfig, PresenterId } from "@/lib/presenter/types";
import type { Presenter, PresenterOptions } from "./types";
import { useAiTwinPresenter } from "./use-aitwin-presenter";
import { useAnamPresenter } from "./use-anam-presenter";
import { useTavusPresenter } from "./use-tavus-presenter";
import { useVoicePresenter } from "./use-voice-presenter";

type PresenterHook = (options: PresenterOptions, config: PresenterConfig) => Presenter;

const PRESENTERS: Record<PresenterId, PresenterHook> = {
  voice: useVoicePresenter,
  anam: useAnamPresenter,
  aitwin: useAiTwinPresenter,
  tavus: useTavusPresenter,
};

export function usePresenter(config: PresenterConfig, options: PresenterOptions): Presenter {
  const usePresenterFor = PRESENTERS[config.id];
  return usePresenterFor(options, config);
}
