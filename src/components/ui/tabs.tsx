"use client";

import { clsx } from "clsx";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps<T extends string> {
  label: string;
  idPrefix: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
}

export const tabId = (prefix: string, value: string) => `${prefix}-tab-${value}`;
export const tabPanelId = (prefix: string, value: string) => `${prefix}-panel-${value}`;

const ARROW_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };

export function Tabs<T extends string>({ label, idPrefix, items, value, onChange }: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector(`#${tabId(idPrefix, value)}`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [idPrefix, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.value === value);
    const next = items[(index + step + items.length) % items.length];
    onChange(next.value);
    listRef.current?.querySelector<HTMLButtonElement>(`#${tabId(idPrefix, next.value)}`)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-bg p-1 shadow-well"
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={tabId(idPrefix, item.value)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={tabPanelId(idPrefix, item.value)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={clsx(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-you-strong",
              selected
                ? "bg-you text-on-you shadow-soft"
                : "text-muted hover:bg-raise/60 hover:text-ink",
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={clsx(
                  "min-w-5 rounded-full px-1.5 text-center text-xs tabular-nums",
                  selected ? "bg-on-you/20 text-on-you" : "bg-line text-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
