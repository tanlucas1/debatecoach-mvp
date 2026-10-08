import type { CaseFile, Side } from "@/lib/case-file/types";
import { LEVEL_LABELS, SIDE_LABELS, opposingSide } from "@/lib/debate/config";
import type { Level, Turn } from "@/lib/debate/types";
import {
  bulletList,
  formatContention,
  formatEvidence,
  heading,
  joinSections,
  labelledList,
  subheading,
} from "@/lib/prompting/format";

const LEVEL_RULES: Record<Level, string> = {
  jc: "Assess at full strength and treat every unanswered argument as dropped.",
  secondary:
    "Assess more gently and use simple, encouraging words. Only mark an argument as dropped if it was central to the round.",
};

interface GradingPromptOptions {
  studentSide: Side;
  level: Level;
}

export function buildGradingSystemPrompt(
  caseFile: CaseFile,
  { studentSide, level }: GradingPromptOptions,
): string {
  const student = SIDE_LABELS[studentSide];
  const ai = SIDE_LABELS[opposingSide(studentSide)];

  return joinSections([
    "You are an experienced debate adjudicator writing practice feedback on a one-on-one practice round between a student and an AI opponent. This is practice feedback from an AI reading a transcript, not an official adjudication.",
    `Motion: ${caseFile.motion}`,
    `The student argued for the ${student}. The AI argued for the ${ai}.`,

    heading(`Level: ${LEVEL_LABELS[level]}`),
    [LEVEL_RULES[level], caseFileGradingNote(caseFile)].filter(Boolean).join("\n"),

    heading("How to assess"),
    bulletList([
      "Speeches are numbered per speaker as they appear in the transcript: Student speech 1, AI speech 1, and so on.",
      "aiArguments: list each distinct argument the AI made, under the AI speech that first made it. It is answered if a later student speech responded to its substance, partly-answered if the student touched it without engaging its reasoning, and dropped if the student never responded. Mark it central if the round turned on it.",
      "studentSpeeches: one entry for every student speech. clash means it directly engaged the AI's previous arguments with reasons or evidence. restating means it repeated the student's own earlier points without engaging. new-argument means it introduced a new point; the opening speech is new-argument. question means it mainly asked the AI a question or for clarification.",
      "evidenceUsed: include a row only when a student claim matches an evidence bank row in substance, even if it is paraphrased or the figure is approximate. Use the row's id. Ignore evidence the AI used.",
      "The student's speeches were transcribed from their voice and may contain recognition errors. Judge the most likely meaning and never penalise transcription errors.",
      'verdict: plain English addressed to the student as "you", never assuming their gender. Keep it short: a summary of at most two sentences, then two or three strengths and two or three improvements, each one specific sentence of no more than 20 words about this round. Do not declare an official winner.',
    ]),

    heading("Case file"),
    subheading(`The student's case (${student})`),
    caseFile.sides[studentSide].contentions.map(formatContention).join("\n\n"),
    subheading(`The AI's case (${ai})`),
    caseFile.sides[opposingSide(studentSide)].contentions.map(formatContention).join("\n\n"),
    subheading("How to weigh the round"),
    labelledList(caseFile.framework.weighing),
    subheading("Evidence bank"),
    caseFile.evidence.map(formatEvidence).join("\n"),
  ]);
}

export function buildTranscriptPrompt(turns: Turn[]): string {
  const counters = { student: 0, ai: 0 };
  const speeches = turns.map(({ speaker, text }) => {
    counters[speaker] += 1;
    const label = speaker === "student" ? "Student" : "AI";
    return `${label} speech ${counters[speaker]}:\n${text}`;
  });
  return joinSections(["Transcript of the round:", ...speeches]);
}

function caseFileGradingNote(caseFile: CaseFile): string {
  return (
    caseFile.developerNotes.find(({ label }) => label.toLowerCase().includes("grading by level"))
      ?.text ?? ""
  );
}
