import { clsx } from "clsx";

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  title,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      title={title}
      className={clsx(
        "inline-flex gap-1 rounded-full border border-line bg-panel p-1 shadow-well max-sm:gap-0.5 max-sm:p-0.5",
        disabled && "opacity-60",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={clsx(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed max-md:px-2.5",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-you-strong",
              selected ? "bg-raise text-ink shadow-soft" : "text-muted enabled:hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
