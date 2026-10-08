import type { ReactNode } from "react";
import type { PlaybackOptions } from "@/components/speech/use-speech-playback";

export interface PresenterOptions extends PlaybackOptions {
  enabled: boolean;
}

export interface Presenter {
  onDelta: (delta: string) => void;
  onEnd: (completed: boolean) => void;
  prepare: () => void;
  silence: () => void;
  isSpeaking: boolean;
  isAudible: boolean;
  stage: ReactNode;
  // Shape of the avatar's video, so the round can frame it without letterbox bars.
  stageAspect?: "aspect-[3/2]" | "aspect-video";
}
