import { describe, expect, it } from "vitest";
import { loadCaseFile } from "@/lib/case-file";
import type { CaseFile, Side } from "@/lib/case-file/types";
import { buildOpponentPrompt } from "./prompt";
import type { Level } from "./types";

const options = (studentSide: Side, level: Level) => ({ studentSide, level, targetWords: 120 });

describe("buildOpponentPrompt", async () => {
  const result = await loadCaseFile("under-16-social-media-ban");
  const caseFile = (result.ok ? result.caseFile : null) as CaseFile;

  it("argues the side the student did not pick", () => {
    const prompt = buildOpponentPrompt(caseFile, options("proposition", "jc"));
    expect(prompt).toContain("You are the Opposition speaker");
    expect(prompt).toContain("## Your case (Opposition)");
    expect(prompt).toContain("## Your prepared answers to the Proposition");
  });

  it("includes every evidence bank item with its id", () => {
    const prompt = buildOpponentPrompt(caseFile, options("opposition", "jc"));
    for (const item of caseFile.evidence) expect(prompt).toContain(`[${item.id}] ${item.fact}`);
  });

  it("sets the target speech length", () => {
    expect(buildOpponentPrompt(caseFile, options("opposition", "jc"))).toContain(
      "Keep each speech to about 120 words and never more than 150.",
    );
  });

  it("uses the level guidance from the case file", () => {
    expect(buildOpponentPrompt(caseFile, options("opposition", "secondary"))).toContain(
      "same arguments, simpler words, shorter turns",
    );
    expect(buildOpponentPrompt(caseFile, options("opposition", "jc"))).toContain(
      "full-strength arguments, evidence cited",
    );
  });
});
