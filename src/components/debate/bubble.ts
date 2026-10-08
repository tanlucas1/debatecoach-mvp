import { clsx } from "clsx";
import type { Speaker } from "@/lib/debate/types";

const SPEAKER_BUBBLES: Record<Speaker, string> = {
  student: "rounded-tr-sm border-you-line bg-you-soft",
  ai: "rounded-tl-sm border-line bg-raise shadow-soft",
};

export function bubbleStyles(speaker: Speaker, className?: string) {
  return clsx(
    "rounded-card border px-4 py-3 text-sm leading-relaxed",
    SPEAKER_BUBBLES[speaker],
    className,
  );
}
