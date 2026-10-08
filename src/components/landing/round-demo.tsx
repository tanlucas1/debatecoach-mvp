"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { bubbleStyles } from "@/components/debate/bubble";
import { StatStrip, type Stat } from "@/components/feedback/stat-strip";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  MicIcon,
  PauseIcon,
  SparkIcon,
  SpeakerIcon,
  SpeakerOffIcon,
} from "@/components/ui/icons";
import { panelStyles } from "@/components/ui/panel";
import { LEVEL_LABELS } from "@/lib/debate/config";
import { formatDuration } from "@/lib/debate/format";
import { DEMO_LEVEL, DEMO_LINES, DEMO_RESULT } from "@/lib/demo/round-demo";
import { type DemoLineState, useRoundDemo } from "./use-round-demo";

const TYPING_DOTS = [0, 1, 2];
const TYPING_STAGGER_MS = 150;

const SPEAKER_STYLES = {
  student: {
    name: "You",
    icon: <MicIcon className="size-2.5" />,
    avatar: "bg-you text-on-you",
    align: "self-end items-end",
    ring: "ring-you-line",
    row: "flex-row-reverse",
  },
  ai: {
    name: "AI opponent",
    icon: <SparkIcon className="size-2.5" />,
    avatar: "bg-ai text-panel",
    align: "self-start items-start",
    ring: "ring-ai-soft",
    row: "",
  },
};

export function RoundDemo() {
  const [muted, setMuted] = useState(true);
  const { stage, lines } = useRoundDemo(DEMO_LINES, muted);
  const showResult = stage === "rest";

  return (
    <section
      aria-label="Demo round"
      className={clsx(panelStyles, "mx-auto flex w-full max-w-xl flex-col overflow-hidden")}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-line px-4 py-3">
        <span
          aria-hidden="true"
          className={buttonStyles({
            size: "sm",
            className: "pointer-events-none gap-1 justify-self-start px-3 text-xs",
          })}
        >
          {LEVEL_LABELS[DEMO_LEVEL]}
          <ChevronRightIcon className="size-3.5 rotate-90 text-muted" />
        </span>
        <span className="text-xs font-semibold text-muted">Demo</span>
        <Button
          size="icon"
          className="justify-self-end"
          aria-label={muted ? "Listen to the demo" : "Mute the demo"}
          title={muted ? "Listen to the demo" : "Mute the demo"}
          aria-pressed={!muted}
          onClick={() => setMuted((value) => !value)}
        >
          {muted ? <SpeakerOffIcon /> : <SpeakerIcon />}
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] *:[grid-area:1/1]">
        <div
          inert={showResult}
          className={clsx(
            "flex flex-col transition-opacity duration-500 motion-reduce:transition-none",
            showResult && "opacity-0",
          )}
        >
          <div className="flex flex-col gap-3 p-5">
            {lines.map((line) => (
              <DemoBubble
                key={line.speaker}
                line={line}
                active={stage === line.speaker}
                waiting={stage === "thinking" && line.speaker === "ai"}
              />
            ))}
          </div>
          <DemoComposer listening={stage === "student"} />
        </div>
        <DemoResult lines={lines} visible={showResult} />
      </div>
    </section>
  );
}

interface DemoResultProps {
  lines: DemoLineState[];
  visible: boolean;
}

function DemoResult({ lines, visible }: DemoResultProps) {
  const student = lines.find(({ speaker }) => speaker === "student");
  const minutes = (student?.durationMs ?? 0) / 60_000;
  const stats: Stat[] = [
    { label: "Evidence used", value: String(DEMO_RESULT.evidenceUsed) },
    {
      label: "Words per minute",
      value: student && minutes > 0 ? String(Math.round(student.words.length / minutes)) : "–",
    },
    { label: "Speaking time", value: student ? formatDuration(student.durationMs) : "–" },
  ];

  return (
    <div
      inert={!visible}
      className={clsx(
        "flex flex-col gap-4 p-5 transition duration-500 motion-reduce:transition-none",
        visible ? "opacity-100" : "translate-y-2 opacity-0",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <p className="text-lg font-bold tracking-tight">Round feedback</p>
        <p className="text-xs text-muted">Practice feedback · not an official result</p>
      </div>
      <StatStrip stats={stats} />
      <ul className="flex flex-col gap-2 text-sm">
        <li className="flex items-start gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-you-strong" />
          {DEMO_RESULT.strength}
        </li>
        <li className="flex items-start gap-2">
          <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-muted" />
          {DEMO_RESULT.improvement}
        </li>
      </ul>
    </div>
  );
}

function DemoComposer({ listening }: { listening: boolean }) {
  return (
    <div
      inert
      aria-hidden="true"
      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-t border-line px-5 py-3"
    >
      <Button
        variant="primary"
        size="icon-lg"
        className={clsx("col-start-2", listening && "animate-invite motion-reduce:animate-none")}
      >
        {listening ? <PauseIcon /> : <MicIcon />}
      </Button>
      <Button variant="action" size="sm" disabled={!listening} className="justify-self-end">
        End turn
      </Button>
    </div>
  );
}

interface DemoBubbleProps {
  line: DemoLineState;
  active: boolean;
  waiting: boolean;
}

function DemoBubble({ line, active, waiting }: DemoBubbleProps) {
  const style = SPEAKER_STYLES[line.speaker];
  const hidden = line.revealed === 0 && !waiting;

  return (
    <div
      className={clsx(
        "flex max-w-[92%] flex-col gap-1.5 transition-opacity duration-300",
        style.align,
        hidden && "opacity-0",
      )}
    >
      <div className={clsx("flex items-center gap-1.5 text-[0.7rem] text-muted", style.row)}>
        <span className={clsx("grid size-4 place-items-center rounded-full", style.avatar)}>
          {style.icon}
        </span>
        {style.name}
      </div>
      <p
        className={bubbleStyles(
          line.speaker,
          clsx("relative transition-shadow", active && clsx("ring-2", style.ring)),
        )}
      >
        {waiting && (
          <span aria-label="Thinking" className="absolute top-4 left-4 flex gap-1">
            {TYPING_DOTS.map((dot) => (
              <span
                key={dot}
                className="size-1.5 animate-bounce rounded-full bg-muted"
                style={{ animationDelay: `${dot * TYPING_STAGGER_MS}ms` }}
              />
            ))}
          </span>
        )}
        {line.words.map((word, index) => (
          <span
            key={index}
            className={clsx(
              "transition-opacity duration-200",
              index >= line.revealed && (line.revealed === 0 ? "opacity-0" : "opacity-25"),
            )}
          >
            {word}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
