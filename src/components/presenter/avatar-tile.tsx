import { clsx } from "clsx";
import type { ReactNode } from "react";

export const AVATAR_BADGE =
  "absolute rounded-full bg-black/45 px-2.5 py-1 text-[0.7rem] font-semibold text-white backdrop-blur-sm";

interface AvatarTileProps {
  status?: { label: string; live: boolean };
  note?: string;
  children: ReactNode;
}

// Video-call style labels over the avatar's video. The round screen draws the frame around it.
export function AvatarTile({ status, note, children }: AvatarTileProps) {
  return (
    <div className="relative size-full">
      <div className="absolute inset-0 bg-raise [&_video]:scale-[1.01]">
        {children}
        {status && (
          <span className={clsx(AVATAR_BADGE, "top-3 left-3 flex items-center gap-1.5")}>
            <span
              className={clsx(
                "size-1.5 rounded-full",
                status.live ? "animate-pulse bg-you motion-reduce:animate-none" : "bg-white/70",
              )}
            />
            {status.label}
          </span>
        )}
        <span className="absolute bottom-3 left-4 text-sm font-semibold text-white italic underline decoration-you decoration-2 underline-offset-4 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
          Debate opponent
        </span>
        {note && (
          <p
            className={clsx(
              AVATAR_BADGE,
              "top-3 left-1/2 max-w-[60%] -translate-x-1/2 text-center font-medium",
            )}
          >
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
