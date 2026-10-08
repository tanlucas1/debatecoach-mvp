import { clsx } from "clsx";
import type { RoundPhase } from "@/lib/debate/phase";
import { SpeakingWave } from "./speaking-wave";

const LISTENING_SCALE_RANGE = 0.18;

type PresenceSize = "sm" | "md";

interface PresenceProps {
  phase: RoundPhase;
  micLevel: number;
  size?: PresenceSize;
  label?: string;
}

const SIZES: Record<PresenceSize, { frame: string; orb: string }> = {
  sm: { frame: "size-24", orb: "size-16 ring-4" },
  md: { frame: "size-32", orb: "size-24 ring-8" },
};

const STATUS: Record<RoundPhase, string> = {
  thinking: "Thinking…",
  speaking: "Speaking",
  listening: "Listening to you",
  "your-turn": "Your turn",
  error: "Something went wrong",
};

export function Presence({ phase, micLevel, size = "md", label }: PresenceProps) {
  const listening = phase === "listening";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={clsx("relative grid place-items-center", SIZES[size].frame)}>
        {phase === "thinking" && (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-orbit rounded-full border-4 border-ai-soft border-t-ai motion-reduce:animate-none"
          />
        )}
        {listening && (
          <span
            aria-hidden="true"
            className="absolute inset-2 rounded-full bg-you-soft transition-transform duration-75"
            style={{ transform: `scale(${1 + micLevel * LISTENING_SCALE_RANGE})` }}
          />
        )}
        <span
          aria-hidden="true"
          className={clsx(
            "relative rounded-full shadow-lifted transition-colors duration-300",
            SIZES[size].orb,
            listening ? "bg-you ring-you-soft" : "bg-ai ring-ai-soft",
            phase === "speaking" && "animate-breathe motion-reduce:animate-none",
          )}
        />
      </div>

      <div className="flex h-6 items-center gap-2 text-sm font-semibold text-muted" role="status">
        {phase === "speaking" && <SpeakingWave />}
        <span className={clsx(phase === "error" && "text-danger", listening && "text-you-strong")}>
          {label ?? STATUS[phase]}
        </span>
      </div>
    </div>
  );
}
