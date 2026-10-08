"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GradeRequest, GradingReport } from "@/lib/grading";

const GRADE_ENDPOINT = "/api/debate/grade";

type FeedbackState =
  | { status: "loading" }
  | { status: "ready"; report: GradingReport }
  | { status: "error"; message: string };

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return `Grading failed with status ${response.status}.`;
}

async function gradeRound(request: GradeRequest): Promise<FeedbackState> {
  try {
    const response = await fetch(GRADE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) return { status: "error", message: await readError(response) };
    return { status: "ready", report: (await response.json()) as GradingReport };
  } catch {
    return { status: "error", message: "Could not reach the server. Check your connection." };
  }
}

export function useRoundFeedback(request: GradeRequest, savedReport?: GradingReport) {
  const [state, setState] = useState<FeedbackState>(
    savedReport ? { status: "ready", report: savedReport } : { status: "loading" },
  );
  const gradingRef = useRef<Promise<FeedbackState> | null>(null);

  useEffect(() => {
    if (savedReport) return;
    let active = true;
    gradingRef.current ??= gradeRound(request);
    void gradingRef.current.then((result) => {
      if (active) setState(result);
    });
    return () => {
      active = false;
    };
  }, [request, savedReport]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    const grading = gradeRound(request);
    gradingRef.current = grading;
    void grading.then((result) => {
      if (gradingRef.current === grading) setState(result);
    });
  }, [request]);

  return { state, retry };
}
