import { describe, expect, it } from "vitest";
import { loadCaseFile } from "@/lib/case-file";
import type { CaseFile } from "@/lib/case-file/types";
import { buildGradingSystemPrompt, buildTranscriptPrompt } from "./prompt";

describe("grading prompts", async () => {
  const result = await loadCaseFile("under-16-social-media-ban");
  const caseFile = (result.ok ? result.caseFile : null) as CaseFile;

  it("frames the feedback as practice, not an official adjudication", () => {
    const prompt = buildGradingSystemPrompt(caseFile, { studentSide: "proposition", level: "jc" });
    expect(prompt).toContain("not an official adjudication");
    expect(prompt).toContain(
      "The student argued for the Proposition. The AI argued for the Opposition.",
    );
  });

  it("uses the gentler Secondary rules and the case file's grading note", () => {
    const prompt = buildGradingSystemPrompt(caseFile, {
      studentSide: "opposition",
      level: "secondary",
    });
    expect(prompt).toContain("Only mark an argument as dropped if it was central to the round.");
    expect(prompt).toContain("In Secondary mode, grade more gently.");
  });

  it("numbers speeches per speaker", () => {
    const transcript = buildTranscriptPrompt([
      { speaker: "student", text: "First." },
      { speaker: "ai", text: "Reply." },
      { speaker: "student", text: "Second." },
    ]);
    expect(transcript).toContain("Student speech 1:\nFirst.");
    expect(transcript).toContain("AI speech 1:\nReply.");
    expect(transcript).toContain("Student speech 2:\nSecond.");
  });
});
