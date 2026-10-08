"use client";

import { useCallback, useEffect, useRef } from "react";

const TIMING_PARAM = "timing";

interface ReplyMarks {
  endedAt: number;
  textAt?: number;
}

const timingRequested = () => new URLSearchParams(window.location.search).has(TIMING_PARAM);

const seconds = (ms: number) => (ms / 1000).toFixed(2);

export function useReplyTiming(speaking: boolean) {
  const marksRef = useRef<ReplyMarks | null>(null);

  const markTurnEnd = useCallback(() => {
    marksRef.current = timingRequested() ? { endedAt: performance.now() } : null;
  }, []);

  const markReplyText = useCallback(() => {
    const marks = marksRef.current;
    if (marks && marks.textAt === undefined) marks.textAt = performance.now();
  }, []);

  useEffect(() => {
    const marks = marksRef.current;
    if (!speaking || !marks) return;
    const text = marks.textAt === undefined ? "–" : seconds(marks.textAt - marks.endedAt);
    console.info(
      `[timing] reply text after ${text}s, speech after ${seconds(performance.now() - marks.endedAt)}s`,
    );
    marksRef.current = null;
  }, [speaking]);

  return { markTurnEnd, markReplyText };
}
