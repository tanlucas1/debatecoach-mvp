const SENTENCE_BOUNDARY = /(?<=[.!?]["'”’)\]]*)\s+/;
const MIN_CHUNK_CHARACTERS = 60;

export interface SpeakableChunks {
  chunks: string[];
  rest: string;
}

export function takeSpeakableChunks(buffer: string): SpeakableChunks {
  const sentences = buffer.split(SENTENCE_BOUNDARY);
  const rest = sentences.pop() ?? "";

  const chunks: string[] = [];
  let pending = "";
  for (const sentence of sentences) {
    pending = pending ? `${pending} ${sentence}` : sentence;
    if (pending.length >= MIN_CHUNK_CHARACTERS) {
      chunks.push(pending.trim());
      pending = "";
    }
  }

  return { chunks, rest: pending ? `${pending} ${rest}` : rest };
}
