import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_LINES, DEMO_TIMINGS_FILE } from "../src/lib/demo/round-demo";
import { synthesizeElevenLabsWithTimings } from "../src/lib/speech/elevenlabs";
import { synthesizeWithProvider } from "../src/lib/speech/synthesize";
import { ELEVENLABS_VOICE_IDS } from "../src/lib/speech/voices";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const TIMINGS_PATH = path.join(process.cwd(), DEMO_TIMINGS_FILE);
const TIMING_DECIMALS = 3;

async function synthesizeLine(text: string, voice: (typeof DEMO_LINES)[number]["voice"]) {
  const elevenLabsVoice = ELEVENLABS_VOICE_IDS[voice];
  if (!elevenLabsVoice) {
    const audio = await synthesizeWithProvider(text, voice);
    return { audio: Buffer.from(await audio.arrayBuffer()), wordStarts: [] };
  }

  const timed = await synthesizeElevenLabsWithTimings(text, elevenLabsVoice);
  if (timed.wordStarts.length === text.split(" ").length) return timed;
  console.warn(`Word timings did not match the text for "${text.slice(0, 40)}…"; using estimates.`);
  return { audio: timed.audio, wordStarts: [] };
}

async function main() {
  const timings: Record<string, number[]> = {};

  for (const line of DEMO_LINES) {
    const { audio, wordStarts } = await synthesizeLine(line.text, line.voice);
    const target = path.join(PUBLIC_DIR, line.audioPath);
    await writeFile(target, audio);
    timings[line.speaker] = wordStarts.map((start) => Number(start.toFixed(TIMING_DECIMALS)));
    console.log(
      `Saved ${path.relative(process.cwd(), target)} (${wordStarts.length} word timings)`,
    );
  }

  await writeFile(TIMINGS_PATH, `${JSON.stringify(timings, null, 2)}\n`);
  console.log(`Saved ${path.relative(process.cwd(), TIMINGS_PATH)}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
