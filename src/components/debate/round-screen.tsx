"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { usePresenter } from "@/components/presenter/use-presenter";
import { useSpeechRecognition } from "@/components/speech/use-speech-recognition";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorBanner } from "@/components/ui/error-banner";
import {
  BookIcon,
  ChatIcon,
  ChecklistIcon,
  CollapseIcon,
  ExpandIcon,
  PanelLeftIcon,
  RestartIcon,
  SpeakerIcon,
  SpeakerOffIcon,
} from "@/components/ui/icons";
import { panelStyles } from "@/components/ui/panel";
import { Sheet } from "@/components/ui/sheet";
import type { CaseFileView } from "@/lib/case-file/types";
import type { DebateSettings, Turn } from "@/lib/debate/types";
import type { LlmProviderId } from "@/lib/llm/types";
import type { PresenterConfig } from "@/lib/presenter/types";
import { useVoice } from "@/lib/speech/use-voice";
import type { VoiceId } from "@/lib/speech/voices";
import { saveSession } from "@/lib/session/saved-session";
import { useStoredFlag } from "@/lib/storage/use-stored-flag";
import { useLeaveWarning } from "@/lib/session/use-leave-warning";
import { CaseDetails, CaseRail } from "./case-rail";
import { RoundProgress } from "./round-progress";
import { RoundIntro, RoundSettings } from "./round-setup";
import { Transcript } from "./transcript";
import { TurnControls } from "./turn-controls";
import { useDebateRound } from "./use-debate-round";
import { useFullscreen } from "./use-fullscreen";
import { useReplyTiming } from "./use-reply-timing";

const CASE_RAIL_KEY = "debate-coach-case-rail";
const TRANSCRIPT_SHOWN_KEY = "debate-coach-transcript-shown";
const MOTION_CARD_ID = "round-motion-card";
const ACTIVE_TOGGLE = "border-you-line bg-you-soft text-you-strong";
const MOBILE_ICON_BUTTON = "max-sm:size-8";

interface RoundScreenProps {
  settings: DebateSettings;
  caseFiles: CaseFileView[];
  onSettingsChange: (settings: DebateSettings) => void;
  onStartedChange: (started: boolean) => void;
  provider: LlmProviderId;
  startedAt: number;
  speechEnabled: boolean;
  voices: readonly VoiceId[];
  presenter: PresenterConfig;
  initialTurns?: Turn[];
  onExit: () => void;
  onFinish: (turns: Turn[]) => void;
}

export function RoundScreen({
  settings,
  caseFiles,
  onSettingsChange,
  onStartedChange,
  provider,
  startedAt,
  speechEnabled,
  voices,
  presenter: presenterConfig,
  initialTurns,
  onExit,
  onFinish,
}: RoundScreenProps) {
  const [voiceOutput, setVoiceOutput] = useState(speechEnabled);
  const [confirmingExit, setConfirmingExit] = useState(false);
  const [showingCase, setShowingCase] = useState(false);
  const [turnBegun, setTurnBegun] = useState(false);
  const [caseRailOpen, setCaseRailOpen] = useStoredFlag(CASE_RAIL_KEY, false);
  const [transcriptShown, setTranscriptShown] = useStoredFlag(TRANSCRIPT_SHOWN_KEY, false);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageAreaRef);
  const caseFile = caseFiles.find(({ id }) => id === settings.caseFileId) ?? caseFiles[0];
  const { voice, markPremiumUnavailable } = useVoice(voices);
  const presenter = usePresenter(presenterConfig, {
    enabled: voiceOutput,
    voice,
    onPremiumUnavailable: markPremiumUnavailable,
  });
  const recognition = useSpeechRecognition(caseFile.id);
  const timing = useReplyTiming(presenter.isAudible);
  const round = useDebateRound({
    settings,
    provider,
    startedAt,
    initialTurns,
    onReplyDelta: (delta) => {
      timing.markReplyText();
      presenter.onDelta(delta);
    },
    onReplyEnd: presenter.onEnd,
  });

  const isAiSpeaking = round.status === "ai-speaking";
  const started = round.turns.length > 0;
  const { restartClock } = round;

  useLeaveWarning(started);

  useEffect(() => {
    onStartedChange(started);
  }, [started, onStartedChange]);

  useEffect(() => {
    if (round.turns.length === 0) return;
    saveSession({ screen: "round", request: { ...settings, provider, turns: round.turns } });
  }, [round.turns, settings, provider]);
  const changeSettings = (next: DebateSettings) => {
    onSettingsChange(next);
    restartClock();
  };

  const aiVoicePlaying = presenter.isSpeaking;

  const startSpeech = () => {
    presenter.prepare();
    presenter.silence();
    if (turnBegun) return;
    restartClock();
    setTurnBegun(true);
  };

  const cancelSpeech = () => setTurnBegun(false);

  const endTurn = (speech: string, spokenAloud: boolean) => {
    timing.markTurnEnd();
    setTurnBegun(false);
    round.submitStudentTurn(speech, spokenAloud);
  };

  const toggleVoiceOutput = () => {
    if (voiceOutput) presenter.silence();
    setVoiceOutput(!voiceOutput);
  };

  const finishRound = () => {
    presenter.silence();
    onFinish(round.turns);
  };

  const hasAvatar = Boolean(presenter.stage);
  const [motionShown, setMotionShown] = useState(false);

  const transcript = (
    <Transcript
      turns={round.turns}
      aiDraft={round.aiDraft}
      thinking={isAiSpeaking && round.aiDraft === ""}
      speaking={presenter.isSpeaking}
    />
  );

  const intro = (
    <RoundIntro
      caseFiles={caseFiles}
      caseFile={caseFile}
      settings={settings}
      onChange={changeSettings}
    />
  );

  const composer = (
    <>
      {round.error && (
        <ErrorBanner
          message={round.error}
          retryLabel="Retry"
          onRetry={() => {
            timing.markTurnEnd();
            round.retryAiTurn();
          }}
          className="mx-4 mb-3 sm:mx-5"
        />
      )}

      <TurnControls
        recognition={recognition}
        voiceInput={speechEnabled}
        onSpeechStart={startSpeech}
        onSpeechCancel={cancelSpeech}
        canSpeak={!round.isAiTurn}
        blockedHint={round.error ? "Tap Retry to get the AI's reply." : undefined}
        clockSince={isAiSpeaking || turnBegun ? round.turnStartedAt : null}
        clockLabel={isAiSpeaking ? "AI speaking" : "Your turn"}
        waiting={
          started && !round.isAiTurn
            ? aiVoicePlaying
              ? { label: "AI speaking" }
              : { label: "Your turn", hint: "Tap the mic" }
            : undefined
        }
        onEndTurn={endTurn}
      />
    </>
  );

  const requestExit = () => {
    if (round.turns.length === 0) onExit();
    else setConfirmingExit(true);
  };

  return (
    <section className={clsx(panelStyles, "flex min-h-0 flex-1 flex-col overflow-hidden")}>
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2.5 border-b border-line px-4 py-3 sm:gap-x-3 sm:px-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            size="icon"
            className={clsx(caseRailOpen && ACTIVE_TOGGLE, "max-md:hidden")}
            aria-label={caseRailOpen ? "Hide your case" : "Show your case"}
            title={caseRailOpen ? "Hide your case" : "Show your case"}
            aria-pressed={caseRailOpen}
            onClick={() => setCaseRailOpen(!caseRailOpen)}
          >
            <PanelLeftIcon />
          </Button>
          <Button
            size="icon"
            className={clsx(MOBILE_ICON_BUTTON, "md:hidden")}
            aria-label="Show your case"
            onClick={() => setShowingCase(true)}
          >
            <PanelLeftIcon />
          </Button>
          {started ? (
            <RoundProgress turns={round.turns} />
          ) : (
            <RoundSettings settings={settings} onChange={changeSettings} />
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {hasAvatar && (
            <Button
              size="icon"
              className={clsx(MOBILE_ICON_BUTTON, transcriptShown && ACTIVE_TOGGLE)}
              aria-label={transcriptShown ? "Hide the transcript" : "Show the transcript"}
              title={transcriptShown ? "Hide the transcript" : "Show the transcript"}
              aria-pressed={transcriptShown}
              onClick={() => setTranscriptShown(!transcriptShown)}
            >
              <ChatIcon />
            </Button>
          )}
          {speechEnabled && (
            <Button
              size="icon"
              className={MOBILE_ICON_BUTTON}
              aria-label={voiceOutput ? "Mute the AI voice" : "Unmute the AI voice"}
              aria-pressed={voiceOutput}
              onClick={toggleVoiceOutput}
            >
              {voiceOutput ? <SpeakerIcon /> : <SpeakerOffIcon />}
            </Button>
          )}
          {started && (
            <Button
              size="sm"
              onClick={requestExit}
              aria-label="New round"
              className={clsx(MOBILE_ICON_BUTTON, "max-sm:px-0")}
            >
              <RestartIcon />
              <span className="max-sm:sr-only">New round</span>
            </Button>
          )}
          {started && (
            <Button
              variant="primary"
              size="sm"
              disabled={isAiSpeaking}
              onClick={finishRound}
              className="max-sm:px-3"
            >
              <ChecklistIcon />
              <span>
                End<span className="max-sm:sr-only"> round</span>
              </span>
            </Button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {caseRailOpen && <CaseRail caseFile={caseFile} side={settings.studentSide} />}

        {hasAvatar ? (
          <div
            ref={stageAreaRef}
            className={clsx(
              "grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)] bg-panel",
              transcriptShown
                ? "grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:'stage'_'transcript'_'composer'] md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:grid-rows-[minmax(0,1fr)_auto] md:[grid-template-areas:'stage_transcript'_'composer_transcript']"
                : "grid-rows-[minmax(0,1fr)_auto] [grid-template-areas:'stage'_'composer']",
            )}
          >
            <div
              aria-label="Avatar"
              role="region"
              className={clsx(
                "relative flex min-h-0 items-center justify-center p-3 [grid-area:stage] md:p-4 [:fullscreen_&]:p-0",
                transcriptShown && "max-md:h-44 max-md:border-b max-md:border-line",
              )}
            >
              <div
                className={clsx(
                  "relative",
                  presenter.stageAspect
                    ? [
                        "h-full max-w-full overflow-hidden rounded-card shadow-lifted ring-1 ring-black/10",
                        "[:fullscreen_&]:aspect-auto [:fullscreen_&]:w-full [:fullscreen_&]:rounded-none [:fullscreen_&]:shadow-none [:fullscreen_&]:ring-0",
                        presenter.stageAspect,
                      ]
                    : "flex size-full items-center justify-center",
                )}
              >
                {presenter.stage}
                {motionShown && (
                  <div
                    id={MOTION_CARD_ID}
                    className="absolute inset-x-3 bottom-13 flex max-h-[60%] justify-center"
                  >
                    <div className="max-w-xl overflow-y-auto rounded-card bg-black/40 text-white shadow-lifted ring-1 ring-white/15 backdrop-blur-[2px]">
                      <RoundIntro
                        compact
                        caseFiles={caseFiles}
                        caseFile={caseFile}
                        settings={settings}
                        onChange={changeSettings}
                      />
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  aria-expanded={motionShown}
                  aria-controls={MOTION_CARD_ID}
                  onClick={() => setMotionShown(!motionShown)}
                  className="absolute right-3 bottom-3 flex cursor-pointer items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-lifted ring-1 ring-black/10 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-95"
                >
                  <BookIcon className="size-3.5" />
                  {motionShown ? "Hide motion" : "Show motion"}
                </button>
                {fullscreen.supported && (
                  <Button
                    size="icon"
                    className="absolute top-3 right-3"
                    aria-label={fullscreen.active ? "Exit full screen" : "Full screen"}
                    title={fullscreen.active ? "Exit full screen" : "Full screen"}
                    onClick={fullscreen.toggle}
                  >
                    {fullscreen.active ? <CollapseIcon /> : <ExpandIcon />}
                  </Button>
                )}
              </div>
            </div>
            {transcriptShown && (
              <div className="flex min-h-0 flex-col border-line [grid-area:transcript] md:border-l">
                {transcript}
              </div>
            )}
            <div className="[grid-area:composer]">{composer}</div>
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {started ? (
              transcript
            ) : (
              <div className="flex min-h-0 flex-1 overflow-y-auto">{intro}</div>
            )}
            {composer}
          </div>
        )}
      </div>

      <Sheet open={showingCase} title="Your case" onClose={() => setShowingCase(false)}>
        <CaseDetails caseFile={caseFile} side={settings.studentSide} />
      </Sheet>

      <ConfirmDialog
        open={confirmingExit}
        title="Start a new round?"
        description="This round will be lost. End the round instead if you want feedback first."
        confirmLabel="Start new round"
        onConfirm={() => {
          presenter.silence();
          onExit();
        }}
        onCancel={() => setConfirmingExit(false)}
      />
    </section>
  );
}
