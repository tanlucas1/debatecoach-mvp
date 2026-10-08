import { describe, expect, it } from "vitest";
import { isValidCaseFileId, suggestCaseFileId } from "./id";

describe("case file ids", () => {
  it("accepts letters, numbers, hyphens and underscores only", () => {
    expect(isValidCaseFileId("under-16-social-media-ban")).toBe(true);
    expect(isValidCaseFileId("school_uniforms")).toBe(true);
    expect(isValidCaseFileId("School Uniforms")).toBe(false);
    expect(isValidCaseFileId("ban (draft)")).toBe(false);
  });

  it("suggests a usable id for a bad file name", () => {
    expect(suggestCaseFileId("School Uniforms")).toBe("school-uniforms");
    expect(suggestCaseFileId(" Ban (draft 2) ")).toBe("ban-draft-2");
  });
});
