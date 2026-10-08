"use client";

import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import { eyebrowStyles } from "@/components/ui/eyebrow";
import { CheckIcon, PlayIcon, StopIcon, VoiceIcon } from "@/components/ui/icons";
import { menuItemStyles } from "@/components/ui/option-menu";
import { Popover } from "@/components/ui/popover";
import { useVoice } from "@/lib/speech/use-voice";
import { VOICES, voicePreviewPath, type VoiceId } from "@/lib/speech/voices";

interface VoiceOptionsProps {
  voices: readonly VoiceId[];
  voice: VoiceId | undefined;
  onSelect: (voice: VoiceId) => void;
}

function VoiceOptions({ voices, voice, onSelect }: VoiceOptionsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState<VoiceId | null>(null);

  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePreview = (id: VoiceId) => {
    audioRef.current ??= new Audio();
    const audio = audioRef.current;
    audio.pause();
    if (previewing === id) {
      setPreviewing(null);
      return;
    }
    audio.src = voicePreviewPath(id);
    audio.onended = () => setPreviewing(null);
    void audio.play().catch(() => setPreviewing(null));
    setPreviewing(id);
  };

  return (
    <div role="radiogroup" aria-label="AI voice" className="flex w-44 flex-col gap-1">
      <p className={clsx(eyebrowStyles, "px-1.5 pt-1 pb-0.5 text-[0.6rem]")}>AI voice</p>
      {voices.map((id) => {
        const { label, description } = VOICES[id];
        const selected = id === voice;
        return (
          <div key={id} className={clsx(menuItemStyles(selected), "cursor-default py-1")}>
            <button
              type="button"
              aria-label={`${previewing === id ? "Stop" : "Play"} a sample of ${label}`}
              onClick={() => togglePreview(id)}
              className="grid size-6 shrink-0 cursor-pointer place-items-center rounded-full border border-line bg-raise text-ink hover:border-you-line focus-visible:outline-2 focus-visible:outline-you-strong [&_svg]:size-3"
            >
              {previewing === id ? <StopIcon /> : <PlayIcon />}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(id)}
              className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-1.5 rounded-md text-left focus-visible:outline-2 focus-visible:outline-you-strong"
            >
              <span className="flex flex-col leading-tight">
                <span className="font-medium">{label}</span>
                <span className="text-[0.65rem] text-muted">{description}</span>
              </span>
              {selected && <CheckIcon className="size-3 shrink-0 text-you-strong" />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface VoiceSettingProps {
  configured: readonly VoiceId[];
  expanded?: boolean;
}

export function VoiceSetting({ configured, expanded = false }: VoiceSettingProps) {
  const { voice, voices, selectVoice } = useVoice(configured);
  if (voices.length < 2) return null;

  if (expanded) return <VoiceOptions voices={voices} voice={voice} onSelect={selectVoice} />;

  return (
    <Popover label="AI voice" className="p-1" trigger={<VoiceIcon className="size-5" />}>
      {(close) => (
        <VoiceOptions
          voices={voices}
          voice={voice}
          onSelect={(next) => {
            selectVoice(next);
            close();
          }}
        />
      )}
    </Popover>
  );
}
