import { describe, expect, it } from "vitest";
import { OPENING_CUE, isAiTurnNext, toChatMessages } from "./messages";
import type { Turn } from "./types";

const student = (text: string): Turn => ({ speaker: "student", text });
const ai = (text: string): Turn => ({ speaker: "ai", text });

describe("isAiTurnNext", () => {
  it("is the AI's turn after each student speech", () => {
    expect(isAiTurnNext([student("a")])).toBe(true);
    expect(isAiTurnNext([student("a"), ai("b"), student("c")])).toBe(true);
  });

  it("is the student's turn at the start and after each AI speech", () => {
    expect(isAiTurnNext([])).toBe(false);
    expect(isAiTurnNext([student("a"), ai("b")])).toBe(false);
  });

  it("rejects turns that do not alternate", () => {
    expect(isAiTurnNext([student("a"), student("b")])).toBe(false);
    expect(isAiTurnNext([ai("a")])).toBe(false);
  });
});

describe("toChatMessages", () => {
  it("maps the student to the user role and the AI to the assistant role", () => {
    expect(toChatMessages([student("a"), ai("b"), student("c")])).toEqual([
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
      { role: "user", content: "c" },
    ]);
  });

  it("opens with a cue when the AI speaks first", () => {
    expect(toChatMessages([])).toEqual([{ role: "user", content: OPENING_CUE }]);
  });
});
