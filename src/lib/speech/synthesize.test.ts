import { beforeEach, describe, expect, it, vi } from "vitest";

const deepgramAudio = new Response("deepgram");
const elevenLabsAudio = new Response("elevenlabs");

const mocks = vi.hoisted(() => ({
  synthesizeSpeech: vi.fn(),
  synthesizeElevenLabs: vi.fn(),
  isElevenLabsConfigured: vi.fn(() => true),
  isSpeechConfigured: vi.fn(() => true),
}));

vi.mock("./deepgram", () => ({
  synthesizeSpeech: mocks.synthesizeSpeech,
  isSpeechConfigured: mocks.isSpeechConfigured,
}));

vi.mock("./elevenlabs", async () => {
  class VoiceQuotaError extends Error {}
  return {
    VoiceQuotaError,
    synthesizeElevenLabs: mocks.synthesizeElevenLabs,
    isElevenLabsConfigured: mocks.isElevenLabsConfigured,
  };
});

const { listAvailableVoices, synthesizeVoice } = await import("./synthesize");
const { VoiceQuotaError } = await import("./elevenlabs");

describe("synthesizeVoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.isElevenLabsConfigured.mockReturnValue(true);
    mocks.synthesizeSpeech.mockResolvedValue(deepgramAudio);
    mocks.synthesizeElevenLabs.mockResolvedValue(elevenLabsAudio);
  });

  it("uses ElevenLabs for an ElevenLabs voice", async () => {
    const result = await synthesizeVoice("Hello", "river");
    expect(result).toEqual({ audio: elevenLabsAudio, fallback: null });
    expect(mocks.synthesizeSpeech).not.toHaveBeenCalled();
  });

  it("uses Deepgram for the standard voice", async () => {
    const result = await synthesizeVoice("Hello", "thalia");
    expect(result).toEqual({ audio: deepgramAudio, fallback: null });
    expect(mocks.synthesizeElevenLabs).not.toHaveBeenCalled();
  });

  it("falls back to Deepgram and reports it when the ElevenLabs credit runs out", async () => {
    mocks.synthesizeElevenLabs.mockRejectedValue(new VoiceQuotaError());
    expect(await synthesizeVoice("Hello", "daniel")).toEqual({
      audio: deepgramAudio,
      fallback: "quota",
    });
  });

  it("falls back to Deepgram when ElevenLabs fails for another reason", async () => {
    mocks.synthesizeElevenLabs.mockRejectedValue(new Error("Service down"));
    expect(await synthesizeVoice("Hello", "alice")).toEqual({
      audio: deepgramAudio,
      fallback: "error",
    });
  });
});

describe("listAvailableVoices", () => {
  it("offers every voice when ElevenLabs is configured", () => {
    mocks.isElevenLabsConfigured.mockReturnValue(true);
    expect(listAvailableVoices()).toEqual(["river", "daniel", "alice", "thalia"]);
  });

  it("offers only the standard voice without an ElevenLabs key", () => {
    mocks.isElevenLabsConfigured.mockReturnValue(false);
    expect(listAvailableVoices()).toEqual(["thalia"]);
  });
});
