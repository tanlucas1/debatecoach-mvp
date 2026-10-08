"use client";

import { clsx } from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { eyebrowStyles } from "@/components/ui/eyebrow";
import { BookIcon, ChatIcon, ChecklistIcon, MicIcon } from "@/components/ui/icons";
import { panelStyles } from "@/components/ui/panel";
import { Tabs, tabId, tabPanelId, type TabItem } from "@/components/ui/tabs";
import { LEVEL_LABELS } from "@/lib/debate/config";
import { formatDuration } from "@/lib/debate/format";
import type { Engagement, GradeRequest, GradingReport } from "@/lib/grading";
import { saveSession } from "@/lib/session/saved-session";
import { useLeaveWarning } from "@/lib/session/use-leave-warning";
import { GradingProgress } from "./grading-progress";
import { StatStrip, type Stat } from "./stat-strip";
import { useRoundFeedback } from "./use-round-feedback";

interface FeedbackScreenProps {
  request: GradeRequest;
  savedReport?: GradingReport;
  onNewRound: () => void;
}

const ENGAGEMENT_STYLES: Record<Engagement, { label: string; tone: BadgeTone }> = {
  clash: { label: "Clash", tone: "you" },
  restating: { label: "Restated", tone: "highlight" },
  "new-argument": { label: "New point", tone: "ai" },
  question: { label: "Question", tone: "outline" },
};

export function FeedbackScreen({ request, savedReport, onNewRound }: FeedbackScreenProps) {
  const { state, retry } = useRoundFeedback(request, savedReport);

  useLeaveWarning(state.status === "loading");

  useEffect(() => {
    if (state.status === "ready")
      saveSession({ screen: "feedback", request, report: state.report });
  }, [state, request]);

  return (
    <section className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className={eyebrowStyles}>Practice feedback</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Round feedback</h1>
          <p className="text-sm text-muted">
            {state.status === "ready" ? `Feedback from ${state.report.gradedBy}` : "AI feedback"} on
            your transcript. Not an official result.
          </p>
        </div>
        <Button variant="primary" onClick={onNewRound}>
          New round
        </Button>
      </header>

      {state.status === "loading" && <GradingProgress />}
      {state.status === "error" && (
        <ErrorBanner message={state.message} retryLabel="Try again" onRetry={retry} />
      )}
      {state.status === "ready" && <Report report={state.report} />}
    </section>
  );
}

type ReportTab = "summary" | "unanswered" | "evidence" | "speeches";

const REPORT_TABS_ID = "report";

function Report({ report }: { report: GradingReport }) {
  const [tab, setTab] = useState<ReportTab>("summary");
  const { unanswered, evidence, speeches } = report;

  const tabs: TabItem<ReportTab>[] = [
    { value: "summary", label: "Summary", icon: <ChecklistIcon /> },
    { value: "unanswered", label: "Unanswered", icon: <ChatIcon />, count: unanswered.length },
    { value: "evidence", label: "Evidence", icon: <BookIcon />, count: evidence.length },
    { value: "speeches", label: "Speeches", icon: <MicIcon />, count: speeches.length },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className={clsx(panelStyles, "flex flex-col overflow-hidden")}>
        <div className="border-b border-line p-3 sm:px-5">
          <Tabs
            label="Feedback sections"
            idPrefix={REPORT_TABS_ID}
            items={tabs}
            value={tab}
            onChange={setTab}
          />
        </div>
        <div
          role="tabpanel"
          id={tabPanelId(REPORT_TABS_ID, tab)}
          aria-labelledby={tabId(REPORT_TABS_ID, tab)}
          className="p-4 sm:p-6"
        >
          {tab === "summary" && <Summary report={report} />}
          {tab === "unanswered" && <UnansweredList items={unanswered} />}
          {tab === "evidence" && <EvidenceList items={evidence} />}
          {tab === "speeches" && <SpeechList items={speeches} />}
        </div>
      </div>
      <p className="text-xs text-muted">
        {LEVEL_LABELS[report.level]} level. Speaking pace counts every second of your turn,
        including pauses.
      </p>
    </div>
  );
}

function Summary({ report }: { report: GradingReport }) {
  const { unanswered, argumentsFaced, clash, evidence, delivery, verdict } = report;

  const stats: Stat[] = [
    {
      label: `Unanswered of ${argumentsFaced}`,
      value: String(unanswered.length),
      alert: unanswered.length > 0,
    },
    clash.eligible === 0
      ? { label: "Clash", value: "–", hint: "No replies yet" }
      : { label: "Clash", value: `${clash.count}/${clash.eligible}` },
    { label: "Evidence used", value: String(evidence.length) },
    {
      label: "Words per minute",
      value: delivery.averageWordsPerMinute === null ? "–" : String(delivery.averageWordsPerMinute),
    },
    {
      label: "Average turn",
      value: delivery.averageTurnMs === null ? "–" : formatDuration(delivery.averageTurnMs),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <StatStrip stats={stats} />
      <p className="max-w-[80ch] leading-relaxed">{verdict.summary}</p>
      <div className="grid gap-5 md:grid-cols-2">
        <PointList title="What worked" items={verdict.strengths} />
        <PointList title="Work on next" items={verdict.improvements} />
      </div>
    </div>
  );
}

function PointList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={eyebrowStyles}>{title}</h3>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed marker:text-you-strong">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const LIST_STYLES = "flex flex-col divide-y divide-line";
const ROW_STYLES = "flex flex-col gap-1 py-3 first:pt-0 last:pb-0";

function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

function UnansweredList({ items }: { items: GradingReport["unanswered"] }) {
  if (items.length === 0) {
    return <EmptyLine>You answered every argument the AI raised.</EmptyLine>;
  }
  return (
    <ul className={LIST_STYLES}>
      {items.map(({ aiSpeech, summary, central }) => (
        <li key={summary} className={ROW_STYLES}>
          <p className="text-sm leading-relaxed">{summary}</p>
          <p className="flex items-center gap-2 text-xs text-muted">
            AI speech {aiSpeech}
            {central && <Badge tone="danger">Central</Badge>}
          </p>
        </li>
      ))}
    </ul>
  );
}

function EvidenceList({ items }: { items: GradingReport["evidence"] }) {
  if (items.length === 0) {
    return <EmptyLine>You didn&apos;t use any figures from the evidence bank.</EmptyLine>;
  }
  return (
    <ul className={LIST_STYLES}>
      {items.map(({ id, fact, source, speech, studentWords }) => (
        <li key={id} className={ROW_STYLES}>
          <p className="flex items-start gap-2 text-sm leading-relaxed">
            <Badge tone="highlight" code className="mt-0.5">
              {id}
            </Badge>
            {fact}
          </p>
          <p className="text-xs text-muted">
            Speech {speech} · {source} · You said: “{studentWords}”
          </p>
        </li>
      ))}
    </ul>
  );
}

function SpeechList({ items }: { items: GradingReport["speeches"] }) {
  return (
    <ol className={LIST_STYLES}>
      {items.map(({ speech, engagement, explanation, words, durationMs, wordsPerMinute }) => (
        <li key={speech} className={ROW_STYLES}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            Speech {speech}
            <Badge tone={ENGAGEMENT_STYLES[engagement].tone}>
              {ENGAGEMENT_STYLES[engagement].label}
            </Badge>
          </p>
          <p className="text-sm leading-relaxed">{explanation}</p>
          <p className="text-xs text-muted tabular-nums">
            {words} words
            {durationMs !== null && ` · ${formatDuration(durationMs)}`}
            {wordsPerMinute !== null && ` · ${wordsPerMinute} words per minute`}
          </p>
        </li>
      ))}
    </ol>
  );
}
