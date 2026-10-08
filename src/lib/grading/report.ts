import type { CaseFile } from "@/lib/case-file/types";
import type { Level, Turn } from "@/lib/debate/types";
import type { GradingAnalysis } from "./schema";
import type { EvidenceUse, GradingReport, SpeechFeedback } from "./types";

const MIN_TIMED_TURN_MS = 5_000;
const MS_PER_MINUTE = 60_000;

interface ReportContext {
  caseFile: CaseFile;
  turns: Turn[];
  level: Level;
  gradedBy: string;
}

export const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

const average = (values: number[]) =>
  values.length === 0
    ? null
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

export function buildGradingReport(
  analysis: GradingAnalysis,
  { caseFile, turns, level, gradedBy }: ReportContext,
): GradingReport {
  const studentTurnIndexes = indexesOf(turns, "student");
  const aiTurnIndexes = indexesOf(turns, "ai");
  const lastStudentIndex = studentTurnIndexes.at(-1) ?? -1;
  const firstAiIndex = aiTurnIndexes[0] ?? Infinity;

  const answerable = (aiSpeech: number) => {
    const turnIndex = aiTurnIndexes[aiSpeech - 1];
    return turnIndex !== undefined && turnIndex < lastStudentIndex;
  };
  const argumentsFaced = analysis.aiArguments.filter(({ aiSpeech }) => answerable(aiSpeech));

  const speeches: SpeechFeedback[] = studentTurnIndexes.map((turnIndex, position) => {
    const speech = position + 1;
    const { text, durationMs = null, spoken = true } = turns[turnIndex];
    const words = countWords(text);
    const assessed = analysis.studentSpeeches.find((item) => item.speech === speech);
    return {
      speech,
      engagement: assessed?.engagement ?? "new-argument",
      explanation: assessed?.explanation ?? "",
      words,
      durationMs,
      wordsPerMinute:
        spoken && durationMs !== null && durationMs >= MIN_TIMED_TURN_MS
          ? Math.round(words / (durationMs / MS_PER_MINUTE))
          : null,
    };
  });

  const eligibleForClash = speeches.filter(
    ({ speech, engagement }) =>
      studentTurnIndexes[speech - 1] > firstAiIndex && engagement !== "question",
  );

  return {
    level,
    gradedBy,
    unanswered: argumentsFaced
      .filter(({ status, central }) => status === "dropped" && (level === "jc" || central))
      .map(({ aiSpeech, summary, central }) => ({ aiSpeech, summary, central })),
    argumentsFaced: argumentsFaced.length,
    speeches,
    clash: {
      count: eligibleForClash.filter(({ engagement }) => engagement === "clash").length,
      eligible: eligibleForClash.length,
    },
    evidence: resolveEvidence(analysis, caseFile, speeches.length),
    delivery: {
      averageTurnMs: average(
        speeches.flatMap(({ durationMs }) => (durationMs === null ? [] : [durationMs])),
      ),
      averageWordsPerMinute: average(
        speeches.flatMap(({ wordsPerMinute }) => (wordsPerMinute === null ? [] : [wordsPerMinute])),
      ),
    },
    verdict: analysis.verdict,
  };
}

function indexesOf(turns: Turn[], speaker: Turn["speaker"]): number[] {
  return turns.flatMap((turn, index) => (turn.speaker === speaker ? [index] : []));
}

function resolveEvidence(
  analysis: GradingAnalysis,
  caseFile: CaseFile,
  speechCount: number,
): EvidenceUse[] {
  const bank = new Map(caseFile.evidence.map((item) => [item.id, item]));
  const seen = new Set<string>();

  return analysis.evidenceUsed.flatMap(({ evidenceId, speech, studentWords }) => {
    const item = bank.get(evidenceId.trim().toUpperCase());
    if (!item || seen.has(item.id) || speech < 1 || speech > speechCount) return [];
    seen.add(item.id);
    return [{ id: item.id, fact: item.fact, source: item.source, speech, studentWords }];
  });
}
