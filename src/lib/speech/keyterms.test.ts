import { describe, expect, it } from "vitest";
import { loadCaseFile } from "@/lib/case-file";
import type { CaseFile } from "@/lib/case-file/types";
import { caseFileKeyterms } from "./keyterms";

describe("caseFileKeyterms", async () => {
  const result = await loadCaseFile("under-16-social-media-ban");
  const terms = caseFileKeyterms((result.ok ? result.caseFile : null) as CaseFile);

  it("includes glossary terms, named sources, topic phrases and debate vocabulary", () => {
    expect(terms).toEqual(
      expect.arrayContaining([
        "Age assurance",
        "VPN",
        "Surgeon General",
        "eSafety",
        "MOH",
        "Singapore",
        "infinite scroll",
        "like counts",
        "opponent",
      ]),
    );
  });

  it("drops months, sentence-start words and fragments of longer names", () => {
    for (const noise of ["Aug", "August", "In Australia", "General", "Jazeera"]) {
      expect(terms).not.toContain(noise);
    }
  });

  it("stays well inside Deepgram's 500-token keyterm budget", () => {
    expect(terms.flatMap((term) => term.split(" ")).length).toBeLessThanOrEqual(200);
    expect(new Set(terms.map((term) => term.toLowerCase())).size).toBe(terms.length);
  });
});
