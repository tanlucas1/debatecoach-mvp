import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { synthesizeWithProvider } from "../src/lib/speech/synthesize";
import { VOICE_IDS, VOICES, voicePreviewPath } from "../src/lib/speech/voices";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const sampleText = (label: string) =>
  `Hi, I'm ${label}. I'll take the other side today, so make your case and I'll answer it.`;

async function main() {
  for (const voice of VOICE_IDS) {
    const { label } = VOICES[voice];
    const audio = await synthesizeWithProvider(sampleText(label), voice);

    const target = path.join(PUBLIC_DIR, voicePreviewPath(voice));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await audio.arrayBuffer()));
    console.log(`Saved ${path.relative(process.cwd(), target)}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
