import { describe, expect, it } from "vitest";
import { loadCaseFile } from "@/lib/case-file";
import type { CaseFile } from "@/lib/case-file/types";
import type { Turn } from "@/lib/debate/types";
import { buildGradingReport, countWords } from "./report";
import type { GradingAnalysis } from "./schema";

const turns: Turn[] = [
  {
    speaker: "student",
    text: "one two three four five six seven eight nine ten",
    durationMs: 30_000,
  },
  { speaker: "ai", text: "AI speech one." },
  { speaker: "student", text: "one two three four five six", durationMs: 12_000 },
  { speaker: "ai", text: "AI speech two." },
  { speaker: "student", text: "Could you explain that?", durationMs: 3_000 },
  { speaker: "ai", text: "AI speech three." },
];

const analysis: GradingAnalysis = {
  aiArguments: [
    {
      aiSpeech: 1,
      summary: "Bans do not work",
      central: true,
      status: "answered",
      answeredInSpeech: 2,
    },
    {
      aiSpeech: 1,
      summary: "Teens lose support",
      central: false,
      status: "dropped",
      answeredInSpeech: null,
    },
    {
      aiSpeech: 2,
      summary: "Privacy costs",
      central: true,
      status: "dropped",
      answeredInSpeech: null,
    },
    {
      aiSpeech: 3,
      summary: "Closing point",
      central: true,
      status: "dropped",
      answeredInSpeech: null,
    },
  ],
  studentSpeeches: [
    { speech: 1, engagement: "new-argument", explanation: "Opened the case." },
    { speech: 2, engagement: "clash", explanation: "Answered the enforcement point." },
    { speech: 3, engagement: "question", explanation: "Asked for clarification." },
  ],
  evidenceUsed: [
    { evidenceId: "E8", speech: 1, studentWords: "double the risk" },
    { evidenceId: "e8", speech: 2, studentWords: "double the risk again" },
    { evidenceId: "E99", speech: 1, studentWords: "made up" },
    { evidenceId: "E4", speech: 7, studentWords: "wrong speech" },
  ],
  verdict: {
    summary: "A close round.",
    strengths: ["Clear opening."],
    improvements: ["Answer privacy."],
  },
};

describe("buildGradingReport", async () => {
  const result = await loadCaseFile("under-16-social-media-ban");
  const caseFile = (result.ok ? result.caseFile : null) as CaseFile;
  const report = (level: "jc" | "secondary") =>
    buildGradingReport(analysis, { caseFile, turns, level, gradedBy: "Claude" });

  it("ignores arguments made after the student's last speech", () => {
    expect(report("jc").argumentsFaced).toBe(3);
    expect(report("jc").unanswered.map(({ summary }) => summary)).not.toContain("Closing point");
  });

  it("flags every dropped argument at JC but only central ones at Secondary", () => {
    expect(report("jc").unanswered.map(({ summary }) => summary)).toEqual([
      "Teens lose support",
      "Privacy costs",
    ]);
    expect(report("secondary").unanswered.map(({ summary }) => summary)).toEqual(["Privacy costs"]);
  });

  it("counts clash only in replies to the AI and leaves out questions", () => {
    expect(report("jc").clash).toEqual({ count: 1, eligible: 1 });
  });

  it("works out speaking rate from words and turn time, skipping very short turns", () => {
    const speeches = report("jc").speeches;
    expect(speeches.map(({ wordsPerMinute }) => wordsPerMinute)).toEqual([20, 30, null]);
    expect(report("jc").delivery).toEqual({ averageTurnMs: 15_000, averageWordsPerMinute: 25 });
  });

  it("leaves speaking rate out of typed speeches", () => {
    const typedTurns = turns.map((turn, index) =>
      index === 2 ? { ...turn, spoken: false } : turn,
    );
    const { speeches } = buildGradingReport(analysis, {
      caseFile,
      turns: typedTurns,
      level: "jc",
      gradedBy: "Claude",
    });
    expect(speeches.map(({ wordsPerMinute }) => wordsPerMinute)).toEqual([20, null, null]);
  });

  it("keeps only real evidence bank rows, once each, from real speeches", () => {
    expect(report("jc").evidence).toEqual([
      expect.objectContaining({ id: "E8", speech: 1, studentWords: "double the risk" }),
    ]);
  });
});

describe("countWords", () => {
  it("counts words separated by any whitespace", () => {
    expect(countWords("  one two\nthree  ")).toBe(3);
    expect(countWords("")).toBe(0);
  });
});
