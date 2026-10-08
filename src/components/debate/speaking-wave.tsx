const WAVE_BARS = [0, 1, 2, 3, 4];
const WAVE_STAGGER_MS = 120;

export function SpeakingWave() {
  return (
    <span aria-hidden="true" className="flex h-3.5 items-center gap-0.5">
      {WAVE_BARS.map((bar) => (
        <span
          key={bar}
          className="h-full w-0.5 origin-center animate-wave rounded-full bg-ai-strong motion-reduce:animate-none"
          style={{ animationDelay: `${bar * WAVE_STAGGER_MS}ms` }}
        />
      ))}
    </span>
  );
}
