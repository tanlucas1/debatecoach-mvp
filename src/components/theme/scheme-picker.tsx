"use client";

import { clsx } from "clsx";
import { CheckIcon } from "@/components/ui/icons";
import { Popover } from "@/components/ui/popover";
import { COLOR_SCHEMES, type ColorMode, type ColorScheme } from "@/lib/theme/config";

const PIE_SLICES: Record<ColorScheme, string> = {
  navy: "M12 12 12 2A10 10 0 0 1 20.66 17Z",
  maroon: "M12 12 20.66 17A10 10 0 0 1 3.34 17Z",
  forest: "M12 12 3.34 17A10 10 0 0 1 12 2Z",
};

interface SchemeSwatchesProps {
  scheme: ColorScheme;
  mode: ColorMode;
  onSelect: (scheme: ColorScheme) => void;
}

export function SchemeSwatches({ scheme, mode, onSelect }: SchemeSwatchesProps) {
  return (
    <div role="group" aria-label="Colour scheme" className="flex gap-1">
      {COLOR_SCHEMES.map(({ id, label }) => {
        const selected = scheme === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(id)}
            className="group flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1.5 py-1 focus-visible:outline-2 focus-visible:outline-you-strong"
          >
            <span
              data-scheme={id}
              data-mode={mode}
              className={clsx(
                "grid size-5 place-items-center rounded-full bg-you text-on-you shadow-icon transition-transform duration-200 group-hover:scale-110 [&_svg]:size-3",
                selected && "ring-2 ring-ink ring-offset-1 ring-offset-panel",
              )}
            >
              {selected && <CheckIcon />}
            </span>
            <span
              className={clsx("text-[0.65rem]", selected ? "font-semibold text-ink" : "text-muted")}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SchemePicker({ scheme, mode, onSelect }: SchemeSwatchesProps) {
  return (
    <Popover
      label="Colour scheme"
      className="p-1.5"
      trigger={
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
          {COLOR_SCHEMES.map(({ id }) => (
            <path key={id} d={PIE_SLICES[id]} data-scheme={id} data-mode={mode} fill="var(--you)" />
          ))}
        </svg>
      }
    >
      {(close) => (
        <SchemeSwatches
          scheme={scheme}
          mode={mode}
          onSelect={(next) => {
            onSelect(next);
            close();
          }}
        />
      )}
    </Popover>
  );
}
