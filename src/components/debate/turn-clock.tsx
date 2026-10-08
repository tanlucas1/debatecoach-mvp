"use client";

import { clsx } from "clsx";
import { formatDuration } from "@/lib/debate/format";
import { useElapsed } from "./use-elapsed";

interface TurnClockProps {
  since: number;
  label: string;
  inline?: boolean;
}

export function TurnClock({ since, label, inline = false }: TurnClockProps) {
  const elapsed = useElapsed(since);

  return (
    <div className={clsx("flex shrink-0", inline ? "items-baseline gap-2" : "w-20 flex-col")}>
      <span className="text-[0.7rem] tracking-wide text-muted">{label}</span>
      <span
        className={clsx("font-mono font-bold tabular-nums", inline ? "text-base" : "text-xl")}
        role="timer"
      >
        {formatDuration(elapsed)}
      </span>
    </div>
  );
}

interface TurnPromptProps {
  label: string;
  hint?: string;
  inline?: boolean;
}

export function TurnPrompt({ label, hint, inline = false }: TurnPromptProps) {
  return (
    <div
      aria-live="polite"
      className={clsx(
        "flex shrink-0 whitespace-nowrap",
        inline ? "items-baseline gap-2" : "min-w-20 flex-col",
      )}
    >
      <span className="text-sm font-semibold text-you-strong">{label}</span>
      {hint && <span className="text-[0.7rem] text-muted">{hint}</span>}
    </div>
  );
}
