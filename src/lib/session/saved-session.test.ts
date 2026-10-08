import { describe, expect, it } from "vitest";
import { SESSION_TTL_MS, parseSession } from "./saved-session";

const NOW = 1_000_000_000;

const request = {
  caseFileId: "under-16-social-media-ban",
  studentSide: "proposition",
  level: "jc",
  provider: "claude",
  turns: [{ speaker: "student", text: "Opening speech.", durationMs: 30_000 }],
};

const raw = (value: unknown) => JSON.stringify(value);

describe("parseSession", () => {
  it("restores a saved round", () => {
    const session = parseSession(raw({ screen: "round", request, savedAt: NOW }), NOW);
    expect(session?.screen).toBe("round");
    expect(session?.request.turns).toHaveLength(1);
  });

  it("restores saved feedback with its report", () => {
    const report = { verdict: { summary: "Good round." } };
    const session = parseSession(raw({ screen: "feedback", request, report, savedAt: NOW }), NOW);
    expect(session?.screen === "feedback" && session.report).toEqual(report);
  });

  it("drops a session older than the time limit", () => {
    const savedAt = NOW - SESSION_TTL_MS - 1;
    expect(parseSession(raw({ screen: "round", request, savedAt }), NOW)).toBeNull();
  });

  it("ignores missing, broken or malformed data", () => {
    expect(parseSession(null, NOW)).toBeNull();
    expect(parseSession("{not json", NOW)).toBeNull();
    expect(parseSession(raw({ screen: "round", savedAt: NOW }), NOW)).toBeNull();
    expect(
      parseSession(raw({ screen: "round", request: { ...request, turns: [] }, savedAt: NOW }), NOW),
    ).toBeNull();
  });
});
