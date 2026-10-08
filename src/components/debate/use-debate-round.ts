"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAiTurnNext } from "@/lib/debate/messages";
import type { DebateSettings, RoundRequest, Turn } from "@/lib/debate/types";
import type { LlmProviderId } from "@/lib/llm/types";

export type RoundStatus = "idle" | "ai-speaking" | "error";

const TURN_ENDPOINT = "/api/debate/turn";
const INTERRUPTED_MESSAGE = "The AI's reply was interrupted. Tap Retry to get it again.";

interface ReplyHandlers {
  onReplyDelta?: (delta: string) => void;
  onReplyEnd?: (completed: boolean) => void;
}

interface UseDebateRoundOptions extends ReplyHandlers {
  settings: DebateSettings;
  provider: LlmProviderId;
  startedAt: number;
  initialTurns?: Turn[];
}

export function useDebateRound({
  settings,
  provider,
  startedAt,
  initialTurns = [],
  onReplyDelta,
  onReplyEnd,
}: UseDebateRoundOptions) {
  const interrupted = isAiTurnNext(initialTurns);
  const [turns, setTurns] = useState<Turn[]>(initialTurns);
  const [aiDraft, setAiDraft] = useState("");
  const [status, setStatus] = useState<RoundStatus>(interrupted ? "error" : "idle");
  const [error, setError] = useState<string | null>(interrupted ? INTERRUPTED_MESSAGE : null);
  const [turnStartedAt, setTurnStartedAt] = useState(startedAt);
  const abortRef = useRef<AbortController | null>(null);
  const handlersRef = useRef<ReplyHandlers>({ onReplyDelta, onReplyEnd });

  useEffect(() => {
    handlersRef.current = { onReplyDelta, onReplyEnd };
  }, [onReplyDelta, onReplyEnd]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const requestAiTurn = useCallback(
    async (history: Turn[], aiStartedAt: number) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("ai-speaking");
      setAiDraft("");
      setError(null);

      const request: RoundRequest = { ...settings, provider, turns: history };

      try {
        const response = await fetch(TURN_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(await readErrorMessage(response));

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let reply = "";
        for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
          reply += chunk.value;
          setAiDraft(reply);
          handlersRef.current.onReplyDelta?.(chunk.value);
        }
        if (!reply.trim()) throw new Error("The AI returned an empty reply.");
        handlersRef.current.onReplyEnd?.(true);

        const finishedAt = Date.now();
        setTurns([
          ...history,
          { speaker: "ai", text: reply.trim(), durationMs: finishedAt - aiStartedAt },
        ]);
        setTurnStartedAt(finishedAt);
        setAiDraft("");
        setStatus("idle");
      } catch (caught) {
        handlersRef.current.onReplyEnd?.(false);
        if (controller.signal.aborted) return;
        setAiDraft("");
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
        setStatus("error");
      }
    },
    [settings, provider],
  );

  const submitStudentTurn = useCallback(
    (text: string, spoken: boolean) => {
      const endedAt = Date.now();
      const history: Turn[] = [
        ...turns,
        { speaker: "student", text: text.trim(), durationMs: endedAt - turnStartedAt, spoken },
      ];
      setTurns(history);
      setTurnStartedAt(endedAt);
      void requestAiTurn(history, endedAt);
    },
    [turns, turnStartedAt, requestAiTurn],
  );

  const restartClock = useCallback(() => setTurnStartedAt(Date.now()), []);

  const retryAiTurn = useCallback(() => {
    const retriedAt = Date.now();
    setTurnStartedAt(retriedAt);
    void requestAiTurn(turns, retriedAt);
  }, [turns, requestAiTurn]);

  return {
    turns,
    aiDraft,
    status,
    error,
    turnStartedAt,
    isAiTurn: isAiTurnNext(turns),
    submitStudentTurn,
    retryAiTurn,
    restartClock,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
    return body.error;
  }
  return `Request failed with status ${response.status}.`;
}
