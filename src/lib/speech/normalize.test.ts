import { describe, expect, it } from "vitest";
import { normalizeForSpeech } from "./normalize";

describe("normalizeForSpeech", () => {
  it("separates words from numbers so they are not spelled out", () => {
    expect(normalizeForSpeech("Over 81% of under-16s were still online.")).toBe(
      "Over 81% of under 16s were still online.",
    );
    expect(normalizeForSpeech("an under-15 ban")).toBe("an under 15 ban");
  });

  it("reads age ranges naturally", () => {
    expect(normalizeForSpeech("for 13- to 17-year-olds")).toBe("for 13 to 17 year-olds");
  });

  it("says currency amounts in full", () => {
    expect(normalizeForSpeech("fines of up to A$49.5 million for failing")).toBe(
      "fines of up to 49.5 million Australian dollars for failing",
    );
    expect(normalizeForSpeech("a S$500 fine")).toBe("a 500 Singapore dollars fine");
  });

  it("turns dashes into pauses and expands abbreviations", () => {
    expect(normalizeForSpeech("We agree — the design is the problem.")).toBe(
      "We agree, the design is the problem.",
    );
    expect(normalizeForSpeech("correlation vs causation, e.g. the MOH panel")).toBe(
      "correlation versus causation, for example the MOH panel",
    );
  });

  it("leaves ordinary text alone", () => {
    const text = "Fix the product, not the child. Well-known research agrees.";
    expect(normalizeForSpeech(text)).toBe(text);
  });
});
