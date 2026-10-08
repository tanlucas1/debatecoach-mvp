import { describe, expect, it } from "vitest";
import { formatDuration } from "./format";

describe("formatDuration", () => {
  it("formats milliseconds as mm:ss", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(61_900)).toBe("01:01");
    expect(formatDuration(12 * 60_000)).toBe("12:00");
  });

  it("keeps counting past an hour without wrapping", () => {
    expect(formatDuration(75 * 60_000)).toBe("75:00");
  });

  it("treats negative input as zero", () => {
    expect(formatDuration(-500)).toBe("00:00");
  });
});
