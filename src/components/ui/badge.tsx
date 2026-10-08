import { clsx } from "clsx";
import type { ReactNode } from "react";

export type BadgeTone = "you" | "ai" | "highlight" | "danger" | "outline";
type BadgeSize = "sm" | "md";

const TONES: Record<BadgeTone, string> = {
  you: "bg-you-soft text-you-strong",
  ai: "bg-ai-soft text-ai-strong",
  highlight: "bg-highlight text-on-highlight",
  danger: "bg-danger-soft text-danger",
  outline: "border border-line text-muted",
};

const SIZES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  code?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({
  tone = "you",
  size = "sm",
  code = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex w-fit shrink-0 items-center font-semibold whitespace-nowrap",
        code ? "rounded-md px-1.5 py-0.5 font-mono text-[0.7rem]" : ["rounded-full", SIZES[size]],
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
