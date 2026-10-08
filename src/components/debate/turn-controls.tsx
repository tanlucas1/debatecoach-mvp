"use client";

import { clsx } from "clsx";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { useSpeechRecognition } from "@/components/speech/use-speech-recognition";
import { Button } from "@/components/ui/button";
import { AutoGrowTextarea } from "@/components/ui/auto-grow-textarea";
import { fieldShellStyles } from "@/components/ui/field";
import { KeyboardIcon, MicIcon, PauseIcon } from "@/components/ui/icons";
import { bubbleStyles } from "./bubble";
import { TurnClock, TurnPrompt } from "./turn-clock";

type Recognition = ReturnType<typeof useSpeechRecognition>;

interface TurnControlsProps {
  recognition: Recognition;
  voiceInput: boolean;
  canSpeak: boolean;
  blockedHint?: string;
  clockSince: number | null;
  clockLabel: string;
  waiting?: { label: string; hint?: string };
  onEndTurn: (speech: string, spoken: boolean) => void;
  onSpeechStart: () => void;
  onSpeechCancel: () => void;
}

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName));

const joinSpeech = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

export function TurnControls({
  recognition,
  voiceInput,
  canSpeak,
  blockedHint = "Wait for the AI to finish…",
  clockSince,
  clockLabel,
  waiting,
  onEndTurn,
  onSpeechStart,
  onSpeechCancel,
}: TurnControlsProps) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(!voiceInput);
  const formRef = useRef<HTMLFormElement>(null);
  const usedVoiceRef = useRef(false);
  const { start, stop } = recognition;

  const isListening = recognition.state !== "idle";
  const isBusy = recognition.state === "starting" || recognition.state === "stopping";
  const liveText = joinSpeech(
    draft,
    recognition.transcript,
    isListening ? recognition.interim : "",
  );
  const canEnd = canSpeak && !isBusy && (isListening || liveText !== "");

  const takeSpoken = useCallback(async () => {
    const spoken = await stop();
    if (spoken) usedVoiceRef.current = true;
    return spoken;
  }, [stop]);

  const endTurn = useCallback(async () => {
    if (!canEnd) return;
    const speech = joinSpeech(draft, await takeSpoken());
    setDraft("");
    if (speech) onEndTurn(speech, usedVoiceRef.current);
    usedVoiceRef.current = false;
  }, [canEnd, takeSpoken, draft, onEndTurn]);

  const toggleListening = async () => {
    const spoken = await takeSpoken();
    setDraft((current) => joinSpeech(current, spoken));
    if (isListening) {
      if (!spoken && !draft.trim()) onSpeechCancel();
      return;
    }
    onSpeechStart();
    const started = await start();
    if (!started && !draft.trim()) onSpeechCancel();
  };

  const changeDraft = (next: string) => {
    if (draft === "" && next !== "") onSpeechStart();
    setDraft(next);
  };

  const toggleTyping = async () => {
    const spoken = await takeSpoken();
    setDraft((current) => joinSpeech(current, spoken));
    setTyping((current) => !current);
  };

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const { target } = event;
      const controlButton =
        target instanceof HTMLButtonElement && formRef.current?.contains(target);
      if (event.code !== "Space" || (isTypingTarget(target) && !controlButton)) return;
      event.preventDefault();
      void endTurn();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [endTurn]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void endTurn();
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void endTurn();
    }
  };

  const micLabel = isListening ? "Pause mic" : liveText ? "Resume speaking" : "Start speaking";

  const showLiveText = !typing && (isListening || liveText !== "");

  const modeToggle = voiceInput && (
    <Button
      size="icon"
      onClick={() => void toggleTyping()}
      aria-label={typing ? "Speak instead" : "Type instead"}
      title={typing ? "Speak instead" : "Type instead"}
    >
      {typing ? <MicIcon /> : <KeyboardIcon />}
    </Button>
  );

  const endButton = (
    <Button type="submit" variant="action" size={typing ? "sm" : "md"} disabled={!canEnd}>
      End turn
      <kbd className="rounded border border-current px-1.5 font-mono text-[0.65rem] opacity-70 max-sm:hidden">
        Space
      </kbd>
    </Button>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="relative border-t border-line px-5 py-3">
      {showLiveText && (
        <div
          aria-live="polite"
          className={bubbleStyles(
            "student",
            "absolute inset-x-5 bottom-full mx-auto mb-3 max-w-3xl shadow-lifted",
          )}
        >
          <div className="flex max-h-[4.25rem] flex-col justify-end overflow-hidden">
            <p>{liveText || "Listening…"}</p>
          </div>
        </div>
      )}

      {recognition.error && (
        <p role="alert" className="mx-auto mb-2 w-full max-w-3xl text-sm text-danger">
          {recognition.error}
        </p>
      )}

      {typing ? (
        <div className={clsx(fieldShellStyles, "mx-auto flex w-full max-w-5xl flex-col")}>
          <AutoGrowTextarea
            id="speech"
            value={draft}
            onChange={(event) => changeDraft(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            disabled={!canSpeak}
            placeholder={canSpeak ? "Type your speech…" : blockedHint}
            aria-label="Your speech"
            className="max-h-[35dvh] w-full bg-transparent px-4 pt-3 pb-1 outline-none placeholder:text-muted disabled:opacity-60"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
            {clockSince !== null ? (
              <TurnClock since={clockSince} label={clockLabel} inline />
            ) : (
              waiting && <TurnPrompt label={waiting.label} inline />
            )}
            <div className="flex items-center gap-2">
              {modeToggle}
              {endButton}
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center gap-3">
            {clockSince !== null ? (
              <TurnClock since={clockSince} label={clockLabel} />
            ) : (
              waiting && <TurnPrompt label={waiting.label} hint={waiting.hint} />
            )}
            <div className="ml-auto">{modeToggle}</div>
          </div>
          <Button
            variant="primary"
            size="icon-lg"
            aria-label={micLabel}
            title={micLabel}
            aria-pressed={isListening}
            disabled={!canSpeak || isBusy}
            onClick={() => void toggleListening()}
            className={clsx(isListening && "animate-invite motion-reduce:animate-none")}
          >
            {isListening ? <PauseIcon /> : <MicIcon />}
          </Button>
          <div className="flex justify-end">{endButton}</div>
        </div>
      )}
    </form>
  );
}
