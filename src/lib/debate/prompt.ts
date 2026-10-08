import type { CaseFile, Side } from "@/lib/case-file/types";
import {
  bulletList,
  formatClashAnswer,
  formatContention,
  formatEvidence,
  heading,
  joinSections,
  labelledList,
  subheading,
} from "@/lib/prompting/format";
import { LEVEL_LABELS, SIDE_LABELS, opposingSide } from "./config";
import type { Level } from "./types";

const WORD_LIMIT_MARGIN = 1.25;

interface OpponentPromptOptions {
  studentSide: Side;
  level: Level;
  targetWords: number;
}

export function buildOpponentPrompt(
  caseFile: CaseFile,
  { studentSide, level, targetWords }: OpponentPromptOptions,
): string {
  const aiSide = opposingSide(studentSide);
  const ai = SIDE_LABELS[aiSide];
  const student = SIDE_LABELS[studentSide];
  const levelLabel = LEVEL_LABELS[level];

  return joinSections([
    `You are the ${ai} speaker in a one-on-one debate practice round. The student speaks for the ${student}.`,
    `Motion: ${caseFile.motion}`,

    heading("How to debate"),
    bulletList([
      `Argue for the ${ai}. Build your case only from the ${ai} contentions and the prepared answers in the case file below. Choose your strongest two or three contentions.`,
      "Respond directly to what the student just said before extending your own case.",
      'You may reason beyond the case file and use well-known general knowledge, flagged lightly with phrases such as "I believe" or "as far as I know".',
      "Take precise statistics, percentages and named studies only from the evidence bank, and name the source in words. Never invent or change a figure.",
      "If the student cites a fact that is not in the case file, you may question its source or relevance, but never claim it is false.",
      "If the student redefines a term unfairly, say so politely and argue under the case file's definition.",
      "If the student drifts off topic, bring the round back to the motion.",
      "Be challenging but respectful. No mocking and no personal comments.",
      'Call the student "my opponent" or "you". Never assume their gender.',
      "The student's speech is transcribed from their voice and may contain recognition errors. Respond to the most likely meaning and never point out the errors.",
      "If the student asks a question or says they did not understand, answer it plainly and briefly, then carry on debating.",
      "Your words will be spoken aloud. Use plain spoken prose with no headings, lists, markdown or stage directions.",
      "Give one speech per turn, as yourself only. Do not write the student's reply or judge the round.",
    ]),

    heading(`Level: ${levelLabel}`),
    [
      levelGuidance(caseFile, levelLabel),
      `Keep each speech to about ${targetWords} words and never more than ${maxWords(targetWords)}. Make fewer points rather than rushing through many.`,
    ]
      .filter(Boolean)
      .join("\n"),

    heading("Case file"),
    subheading("Definitions"),
    labelledList(caseFile.framework.definitions),
    subheading("Burdens"),
    labelledList(caseFile.framework.burdens),
    subheading("How to weigh the round"),
    labelledList(caseFile.framework.weighing),

    subheading(`Your case (${ai})`),
    caseFile.sides[aiSide].coreStory,
    caseFile.sides[aiSide].contentions.map(formatContention).join("\n\n"),

    subheading(`The student's likely case (${student})`),
    caseFile.sides[studentSide].coreStory,
    caseFile.sides[studentSide].contentions.map(formatContention).join("\n\n"),

    subheading(`Your prepared answers to the ${student}`),
    caseFile.clash.answers[aiSide].map(formatClashAnswer).join("\n"),

    subheading("Key clash points"),
    labelledList(caseFile.clash.keyPoints),

    subheading("Evidence bank (the only source of precise figures)"),
    caseFile.evidence.map(formatEvidence).join("\n"),

    subheading("Glossary"),
    labelledList(caseFile.glossary),
  ]);
}

const maxWords = (targetWords: number) => Math.round(targetWords * WORD_LIMIT_MARGIN);

function levelGuidance(caseFile: CaseFile, levelLabel: string): string {
  const match = caseFile.developerNotes
    .flatMap((note) => note.children)
    .find((item) => item.label.toLowerCase() === levelLabel.toLowerCase());
  return match?.text ?? "";
}
