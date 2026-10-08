import { clsx } from "clsx";
import type { Turn } from "@/lib/debate/types";

const MAX_DOTS = 12;

export function RoundProgress({ turns }: { turns: Turn[] }) {
  const recent = turns.slice(-MAX_DOTS);

  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <span className="font-semibold whitespace-nowrap tabular-nums">Turn {turns.length + 1}</span>
      {recent.length > 0 && (
        <span aria-hidden="true" className="hidden items-center gap-1 sm:flex">
          {recent.map((turn, index) => (
            <span
              key={turns.length - recent.length + index}
              className={clsx(
                "size-1.5 rounded-full",
                turn.speaker === "student" ? "bg-you" : "bg-ai",
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}
