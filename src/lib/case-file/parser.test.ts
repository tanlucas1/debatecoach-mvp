import { describe, expect, it } from "vitest";
import { listCaseFileIds, loadCaseFile } from "./loader";
import { parseCaseFileHtml } from "./parser";
import type { CaseFile } from "./types";

const MINIMAL_VALID_SECTIONS = `
  <h2>Motion</h2><p>Motion: Test motion.</p>
  <h2>Opposition case</h2>
  <h3>O1. Claim</h3><p>In plain English: summary</p>
  <ul><li><strong>Warrant:</strong> w</li><li><strong>Evidence:</strong> e</li><li><strong>Impact:</strong> i</li></ul>
`;

describe("under-16 social media ban case file", async () => {
  const result = await loadCaseFile("under-16-social-media-ban");
  const caseFile = (result.ok ? result.caseFile : null) as CaseFile;

  it("parses without issues", () => {
    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("reads the motion and usage notes", () => {
    expect(caseFile.motion).toBe("This House would ban social media for children under 16.");
    expect(caseFile.usage.map((item) => item.label)).toEqual([
      "Level",
      "Sides",
      "Format",
      "How the avatar should use this file",
    ]);
  });

  it("reads the framework", () => {
    expect(caseFile.framework.definitions).toHaveLength(4);
    expect(caseFile.framework.burdens.map((item) => item.label)).toEqual([
      "Proposition",
      "Opposition",
    ]);
    expect(caseFile.framework.weighing).toHaveLength(5);
  });

  it("reads four complete contentions per side", () => {
    for (const side of Object.values(caseFile.sides)) {
      expect(side.coreStory).not.toBe("");
      expect(side.contentions).toHaveLength(4);
      for (const contention of side.contentions) {
        expect(contention.summary).not.toBe("");
        expect(contention.warrant).not.toBe("");
        expect(contention.impact).not.toBe("");
        expect(contention.evidence.length).toBeGreaterThan(0);
      }
    }
    expect(caseFile.sides.proposition.contentions[0].evidence.map((item) => item.label)).toEqual([
      "Evidence",
      "Local evidence",
    ]);
  });

  it("reads both clash tables and the key clash points", () => {
    expect(caseFile.clash.answers.proposition).toHaveLength(5);
    expect(caseFile.clash.answers.opposition).toHaveLength(5);
    expect(caseFile.clash.answers.opposition[0].targetId).toBe("P1");
    expect(caseFile.clash.keyPoints.map((item) => item.label)).toEqual([
      "Effectiveness",
      "Causation",
      "Alternatives",
    ]);
  });

  it("reads the evidence bank", () => {
    expect(caseFile.evidence).toHaveLength(18);
    expect(caseFile.evidence[0]).toMatchObject({
      id: "E1",
      helps: "opposition",
      source: "Al Jazeera, Aug 2026 (eSafety report)",
    });
    expect(caseFile.evidence[0].sourceUrl).toMatch(/^https:\/\//);
    expect(caseFile.evidence.filter((item) => item.helps === "both")).toHaveLength(3);
  });

  it("reads the glossary and the level notes", () => {
    expect(caseFile.glossary).toHaveLength(11);
    const difficulty = caseFile.developerNotes.find((note) => note.label === "Difficulty level");
    expect(difficulty?.children.map((item) => item.label)).toEqual(["JC", "Secondary"]);
  });

  it("is discoverable by id", async () => {
    expect(await listCaseFileIds()).toContain("under-16-social-media-ban");
  });
});

describe("issue reporting", () => {
  it("rejects a file with missing required sections", () => {
    const result = parseCaseFileHtml("<h1>Title</h1><h2>Motion</h2><p>Motion: Test.</p>", "test");
    const errors = result.issues.filter((issue) => issue.severity === "error");

    expect(result.ok).toBe(false);
    expect(errors.map((issue) => issue.message)).toEqual([
      'Missing section with a Heading 2 starting "Proposition case".',
      'Missing section with a Heading 2 starting "Opposition case".',
      'Missing section with a Heading 2 starting "Evidence bank".',
    ]);
  });

  it("names the contention and the part that is missing", () => {
    const html = `${MINIMAL_VALID_SECTIONS}
      <h2>Proposition case</h2>
      <h3>P1. Claim</h3><p>In plain English: summary</p>
      <ul><li><strong>Warrant:</strong> w</li><li><strong>Evidence:</strong> e</li></ul>
      <h2>Evidence bank</h2>
      <table><tr><th>Fact</th><th>Helps</th><th>Source</th></tr><tr><td>f</td><td>Prop</td><td>s</td></tr></table>`;

    const result = parseCaseFileHtml(html, "test");

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      severity: "error",
      location: "Proposition case P1",
      message: 'Missing an "Impact:" bullet.',
    });
  });

  it("rejects an evidence row with an unknown side", () => {
    const html = `${MINIMAL_VALID_SECTIONS}
      <h2>Proposition case</h2>
      <h3>P1. Claim</h3><p>In plain English: summary</p>
      <ul><li><strong>Warrant:</strong> w</li><li><strong>Evidence:</strong> e</li><li><strong>Impact:</strong> i</li></ul>
      <h2>Evidence bank</h2>
      <table><tr><th>Fact</th><th>Helps</th><th>Source</th></tr><tr><td>f</td><td>Maybe</td><td>s</td></tr></table>`;

    const result = parseCaseFileHtml(html, "test");

    expect(result.ok).toBe(false);
    expect(result.issues).toContainEqual({
      severity: "error",
      location: "Evidence bank row 1",
      message: '"Helps" must be Prop, Opp or Both, found "Maybe".',
    });
  });
});
