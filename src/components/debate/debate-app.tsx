"use client";

import { clsx } from "clsx";
import { useMemo, useState, useSyncExternalStore } from "react";
import { FeedbackScreen } from "@/components/feedback/feedback-screen";
import { APP_CONTAINER } from "@/components/site/layout";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Notice } from "@/components/ui/notice";
import type { CaseFileView } from "@/lib/case-file/types";
import type { DebateSettings, Turn } from "@/lib/debate/types";
import type { GradeRequest, GradingReport } from "@/lib/grading";
import type { LlmProviderId, LlmProviderOption } from "@/lib/llm/types";
import type { PresenterConfig, PresenterId } from "@/lib/presenter/types";
import type { VoiceId } from "@/lib/speech/voices";
import {
  clearSession,
  parseSession,
  readStoredSession,
  saveSession,
  type SavedSession,
} from "@/lib/session/saved-session";
import { AppHeader } from "./app-header";
import { RoundScreen } from "./round-screen";

interface DebateAppProps {
  caseFiles: CaseFileView[];
  providers: LlmProviderOption[];
  defaultProvider?: LlmProviderId;
  speechEnabled: boolean;
  voices: VoiceId[];
  presenter: PresenterConfig;
  presenterOptions: PresenterConfig[];
}

type Screen =
  | { name: "round"; startedAt: number; initialTurns?: Turn[] }
  | { name: "feedback"; request: GradeRequest; key: number; savedReport?: GradingReport };

const subscribeNever = () => () => {};

function resumePrompt(session: SavedSession) {
  if (session.screen === "feedback") {
    return {
      title: "See your last feedback?",
      description: "Your previous round's feedback is still here.",
      confirmLabel: "Show feedback",
    };
  }
  const speeches = session.request.turns.length;
  return {
    title: "Resume your round?",
    description: `You have an unfinished round with ${speeches} ${speeches === 1 ? "speech" : "speeches"}. Pick up where you left off.`,
    confirmLabel: "Resume round",
  };
}

export function DebateApp({
  caseFiles,
  providers,
  defaultProvider,
  speechEnabled,
  voices,
  presenter: defaultPresenter,
  presenterOptions,
}: DebateAppProps) {
  const [provider, setProvider] = useState<LlmProviderId | undefined>(defaultProvider);
  const [presenterId, setPresenterId] = useState<PresenterId>(defaultPresenter.id);
  const presenter = presenterOptions.find(({ id }) => id === presenterId) ?? defaultPresenter;
  const [settings, setSettings] = useState<DebateSettings>(() => ({
    caseFileId: caseFiles[0]?.id ?? "",
    studentSide: "proposition",
    level: "jc",
  }));
  const [screen, setScreen] = useState<Screen>(() => ({ name: "round", startedAt: Date.now() }));
  const [roundStarted, setRoundStarted] = useState(false);
  const storedSession = useSyncExternalStore(subscribeNever, readStoredSession, () => null);
  const savedSession = useMemo(() => parseSession(storedSession), [storedSession]);
  const [resumeHandled, setResumeHandled] = useState(false);

  const newRound = () => {
    clearSession();
    setScreen({ name: "round", startedAt: Date.now() });
  };

  const resume = (session: SavedSession) => {
    const { provider: savedProvider, turns, ...savedSettings } = session.request;
    setResumeHandled(true);
    if (providers.some(({ id }) => id === savedProvider)) setProvider(savedProvider);
    if (session.screen === "feedback") {
      setScreen({
        name: "feedback",
        request: session.request,
        key: Date.now(),
        savedReport: session.report,
      });
      return;
    }
    setSettings(savedSettings);
    setScreen({ name: "round", startedAt: Date.now(), initialTurns: turns });
  };

  const discardSaved = () => {
    clearSession();
    setResumeHandled(true);
  };

  const renderContent = () => {
    if (!provider) {
      return <Notice>No AI model is configured. Add an API key to the environment.</Notice>;
    }
    if (caseFiles.length === 0) {
      return <Notice>No valid case files were found in case-files/.</Notice>;
    }

    if (screen.name === "feedback") {
      return (
        <FeedbackScreen
          key={screen.key}
          request={screen.request}
          savedReport={screen.savedReport}
          onNewRound={newRound}
        />
      );
    }

    return (
      <RoundScreen
        key={`${screen.startedAt}-${presenter.id}`}
        settings={settings}
        caseFiles={caseFiles}
        onSettingsChange={setSettings}
        onStartedChange={setRoundStarted}
        provider={provider}
        startedAt={screen.startedAt}
        speechEnabled={speechEnabled}
        voices={voices}
        presenter={presenter}
        initialTurns={screen.initialTurns}
        onExit={newRound}
        onFinish={(turns) => {
          const request = { ...settings, provider, turns };
          saveSession({ screen: "feedback", request });
          setScreen({ name: "feedback", request, key: screen.startedAt });
        }}
      />
    );
  };

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader
        providers={providers}
        voices={presenter.id === "voice" ? voices : []}
        provider={provider}
        onProviderChange={setProvider}
        presenters={presenterOptions.map(({ id }) => id)}
        presenter={presenter.id}
        onPresenterChange={setPresenterId}
        locked={screen.name === "round" && roundStarted}
      />
      <main
        className={clsx("flex min-h-0 flex-1 flex-col overflow-y-auto py-5 sm:py-6", APP_CONTAINER)}
      >
        {renderContent()}
      </main>
      {savedSession && (
        <ConfirmDialog
          open={screen.name === "round" && !roundStarted && !resumeHandled}
          {...resumePrompt(savedSession)}
          cancelLabel="Start new"
          focus="confirm"
          onConfirm={() => resume(savedSession)}
          onCancel={discardSaved}
          onDismiss={() => setResumeHandled(true)}
        />
      )}
    </div>
  );
}
