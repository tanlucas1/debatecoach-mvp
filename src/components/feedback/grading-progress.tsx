"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { Presence } from "@/components/debate/presence";
import { useElapsed } from "@/components/debate/use-elapsed";
import { panelStyles } from "@/components/ui/panel";
import { formatDuration } from "@/lib/debate/format";

const SLOW_AFTER_MS = 60_000;

export function GradingProgress() {
  const [startedAt] = useState(Date.now);
  const elapsed = useElapsed(startedAt);

  return (
    <div className={clsx(panelStyles, "flex flex-col items-center gap-3 px-6 py-12 text-center")}>
      <Presence phase="thinking" micLevel={0} label="Reading your round…" />
      <p className="text-xs text-muted tabular-nums">
        <span className="font-mono font-semibold text-ink">{formatDuration(elapsed)}</span> ·{" "}
        {elapsed < SLOW_AFTER_MS
          ? "This can take a minute."
          : "Still working. Longer rounds take a little more time."}
      </p>
    </div>
  );
}
