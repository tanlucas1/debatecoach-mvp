"use client";

import { clsx } from "clsx";
import { buttonStyles } from "./button";
import { CheckIcon, ChevronRightIcon } from "./icons";
import { Popover } from "./popover";

export const menuItemStyles = (selected: boolean) =>
  clsx(
    "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-2 focus-visible:outline-you-strong",
    selected ? "bg-you-soft" : "hover:bg-raise",
  );

interface MenuOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface OptionMenuProps<T extends string> {
  label: string;
  value: T;
  options: readonly MenuOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  title?: string;
}

export function OptionMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  title,
}: OptionMenuProps<T>) {
  const current = options.find((option) => option.value === value);

  return (
    <Popover
      label={`${label}: ${current?.label}`}
      align="start"
      className="p-1"
      disabled={disabled}
      title={title}
      triggerClassName={buttonStyles({
        size: "sm",
        className: "gap-1 px-3 text-xs max-sm:px-2.5",
      })}
      trigger={
        <>
          {current?.label}
          <ChevronRightIcon className="size-3.5 rotate-90 text-muted" />
        </>
      }
    >
      {(close) => (
        <div role="radiogroup" aria-label={label} className="flex min-w-32 flex-col gap-1">
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                className={clsx(menuItemStyles(selected), "gap-3")}
              >
                <span className="font-medium">{option.label}</span>
                <span className="ml-auto text-[0.65rem] text-muted">{option.description}</span>
                <CheckIcon
                  className={clsx("size-3 shrink-0 text-you-strong", !selected && "invisible")}
                />
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
