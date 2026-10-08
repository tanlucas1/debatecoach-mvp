"use client";

import { clsx } from "clsx";
import { useEffect, useRef } from "react";
import { formatDuration } from "@/lib/debate/format";
import type { Turn } from "@/lib/debate/types";
import { bubbleStyles } from "./bubble";
import { SpeakingWave } from "./speaking-wave";

interface TranscriptProps {
  turns: Turn[];
  aiDraft: string;
  thinking: boolean;
  speaking: boolean;
}

const TYPING_DOTS = [0, 1, 2];
const TYPING_STAGGER_MS = 150;

function turnMeta({ speaker, durationMs }: Turn): string {
  if (durationMs === undefined) return "Speaking now";
  return speaker === "student" ? formatDuration(durationMs) : "Reply";
}

export function Transcript({ turns, aiDraft, thinking, speaking }: TranscriptProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const entries: Turn[] = aiDraft ? [...turns, { speaker: "ai", text: aiDraft }] : turns;
  const lastAiIndex = entries.findLastIndex(({ speaker }) => speaker === "ai");

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [entries.length, aiDraft, thinking]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6"
      aria-live="polite"
    >
      {entries.map((turn, index) => {
        const isStudent = turn.speaker === "student";
        return (
          <div
            key={index}
            className={clsx(
              "flex max-w-[min(75ch,85%)] flex-col gap-1",
              isStudent ? "items-end self-end" : "items-start self-start",
            )}
          >
            <p className="flex items-center gap-2 px-1 text-[0.7rem] text-muted tabular-nums">
              {isStudent ? "You" : "AI"} · {turnMeta(turn)}
              {speaking && index === lastAiIndex && <SpeakingWave />}
            </p>
            <p className={bubbleStyles(turn.speaker, "whitespace-pre-wrap")}>{turn.text}</p>
          </div>
        );
      })}
      {thinking && (
        <div className="flex flex-col items-start gap-1 self-start">
          <p className="px-1 text-[0.7rem] text-muted">AI · Thinking</p>
          <p className={bubbleStyles("ai", "flex gap-1 py-4")} aria-label="The AI is thinking">
            {TYPING_DOTS.map((dot) => (
              <span
                key={dot}
                className="size-1.5 animate-bounce rounded-full bg-muted motion-reduce:animate-none"
                style={{ animationDelay: `${dot * TYPING_STAGGER_MS}ms` }}
              />
            ))}
          </p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
