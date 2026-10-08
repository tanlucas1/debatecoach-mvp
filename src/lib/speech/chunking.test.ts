import { describe, expect, it } from "vitest";
import { takeSpeakableChunks } from "./chunking";

describe("takeSpeakableChunks", () => {
  it("keeps an unfinished sentence as the rest", () => {
    expect(takeSpeakableChunks("That is correlation, not proof of")).toEqual({
      chunks: [],
      rest: "That is correlation, not proof of",
    });
  });

  it("releases complete sentences once they are long enough to speak", () => {
    const text =
      "Over 81% of Australian under-16s still used a restricted platform after the ban. A rule";
    expect(takeSpeakableChunks(text)).toEqual({
      chunks: ["Over 81% of Australian under-16s still used a restricted platform after the ban."],
      rest: "A rule",
    });
  });

  it("groups short sentences into one chunk", () => {
    const { chunks, rest } = takeSpeakableChunks(
      "Thank you. Two responses. First, that figure is correlation, not causation at all. Next",
    );
    expect(chunks).toEqual([
      "Thank you. Two responses. First, that figure is correlation, not causation at all.",
    ]);
    expect(rest).toBe("Next");
  });

  it("does not split decimals or currency", () => {
    const { chunks } = takeSpeakableChunks(
      "Australian platforms face fines of up to A$49.5 million for failing to act. ",
    );
    expect(chunks).toEqual([
      "Australian platforms face fines of up to A$49.5 million for failing to act.",
    ]);
  });

  it("carries short complete sentences into the rest", () => {
    expect(takeSpeakableChunks("Thank you. Now")).toEqual({ chunks: [], rest: "Thank you. Now" });
  });
});
