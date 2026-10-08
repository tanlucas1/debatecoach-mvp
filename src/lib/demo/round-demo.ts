import type { Level, Speaker } from "@/lib/debate/types";
import type { VoiceId } from "@/lib/speech/voices";
import DEMO_TIMINGS from "./demo-timings.json";

export interface DemoLine {
  speaker: Speaker;
  text: string;
  audioPath: string;
  voice: VoiceId;
  wordStarts: number[];
}

const DEMO_AUDIO_DIR = "demo";

export const DEMO_LEVEL: Level = "jc";

export const DEMO_TIMINGS_FILE = "src/lib/demo/demo-timings.json";

const timings: Partial<Record<Speaker, number[]>> = DEMO_TIMINGS;

export const DEMO_LINES: DemoLine[] = [
  {
    speaker: "student",
    text: "Social media is built to keep young teens scrolling. Heavy use is linked to depression and anxiety, so we should act before more children are harmed.",
    audioPath: `/${DEMO_AUDIO_DIR}/student.mp3`,
    voice: "daniel",
    wordStarts: timings.student ?? [],
  },
  {
    speaker: "ai",
    text: "My opponent is right that the risks are real, but a ban does not remove them. Teens will simply lie about their age, and platforms get let off the hook. Fixing the design protects children far better.",
    audioPath: `/${DEMO_AUDIO_DIR}/ai.mp3`,
    voice: "river",
    wordStarts: timings.ai ?? [],
  },
];

export const DEMO_RESULT = {
  evidenceUsed: 1,
  strength: "Clear opening backed by evidence.",
  improvement: "Answer the AI's point that teens can lie about their age.",
};
