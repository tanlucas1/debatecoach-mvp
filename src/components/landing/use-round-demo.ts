"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoLine } from "@/lib/demo/round-demo";

const TICK_MS = 100;
const THINKING_MS = 1_400;
const REST_MS = 6_000;
const FALLBACK_WORDS_PER_SECOND = 2.5;

type PauseStage = "thinking" | "rest";

export type DemoStage = DemoLine["speaker"] | PauseStage;

type Step = { kind: "line"; index: number } | { kind: "pause"; stage: PauseStage; ms: number };

export interface DemoLineState extends DemoLine {
  words: string[];
  revealed: number;
  durationMs: number;
}

function buildSteps(lines: DemoLine[]): Step[] {
  const steps: Step[] = [];
  lines.forEach((line, index) => {
    if (line.speaker === "ai") steps.push({ kind: "pause", stage: "thinking", ms: THINKING_MS });
    steps.push({ kind: "line", index });
  });
  steps.push({ kind: "pause", stage: "rest", ms: REST_MS });
  return steps;
}

const estimateDurationMs = (line: DemoLine) =>
  (line.text.split(" ").length / FALLBACK_WORDS_PER_SECOND) * 1000;

function spokenWords(line: DemoLine, total: number, elapsedMs: number, durationMs: number) {
  if (line.wordStarts.length === total) {
    return line.wordStarts.filter((start) => start * 1000 <= elapsedMs).length;
  }
  return Math.min(total, Math.ceil((total * elapsedMs) / durationMs));
}

const stepDuration = (step: Step, durations: number[]) =>
  step.kind === "line" ? durations[step.index] : step.ms;

export function useRoundDemo(lines: DemoLine[], muted: boolean) {
  const steps = useMemo(() => buildSteps(lines), [lines]);
  const [durations, setDurations] = useState(() => lines.map(estimateDurationMs));
  const [position, setPosition] = useState({ step: 0, elapsedMs: 0 });
  const audiosRef = useRef<HTMLAudioElement[]>([]);
  const stepRef = useRef(0);
  const startRef = useRef(0);
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    const audios = lines.map((line, index) => {
      const audio = new Audio(line.audioPath);
      audio.preload = "metadata";
      audio.addEventListener("loadedmetadata", () =>
        setDurations((current) => current.with(index, audio.duration * 1000)),
      );
      return audio;
    });
    audiosRef.current = audios;
    return () => audios.forEach((audio) => audio.pause());
  }, [lines]);

  useEffect(() => {
    if (!startRef.current) startRef.current = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const step = steps[stepRef.current];
      const audio = step.kind === "line" ? audiosRef.current[step.index] : undefined;
      if (audio && !mutedRef.current && !audio.paused) {
        startRef.current = now - audio.currentTime * 1000;
      }
      let elapsedMs = now - startRef.current;
      if (elapsedMs >= stepDuration(steps[stepRef.current], durations)) {
        stepRef.current = (stepRef.current + 1) % steps.length;
        startRef.current = now;
        elapsedMs = 0;
      }
      setPosition({ step: stepRef.current, elapsedMs });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [steps, durations]);

  const current = steps[position.step];
  const speakingIndex = current.kind === "line" ? current.index : null;

  useEffect(() => {
    const audios = audiosRef.current;
    audios.forEach((audio) => audio.pause());
    if (muted || speakingIndex === null) return;

    const audio = audios[speakingIndex];
    audio.currentTime = (performance.now() - startRef.current) / 1000;
    void audio.play().catch(() => audio.pause());
  }, [muted, speakingIndex]);

  const lineStates: DemoLineState[] = lines.map((line, index) => {
    const words = line.text.split(" ");
    const lineStep = steps.findIndex((step) => step.kind === "line" && step.index === index);
    let revealed = 0;
    if (position.step > lineStep) revealed = words.length;
    if (position.step === lineStep)
      revealed = spokenWords(line, words.length, position.elapsedMs, durations[index]);
    return { ...line, words, revealed, durationMs: durations[index] };
  });

  const stage: DemoStage = current.kind === "line" ? lines[current.index].speaker : current.stage;

  return { stage, lines: lineStates };
}
