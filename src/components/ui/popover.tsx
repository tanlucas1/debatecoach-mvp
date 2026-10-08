"use client";

import { clsx } from "clsx";
import { useId, useRef, type ReactNode, type ToggleEvent } from "react";
import { buttonStyles } from "./button";

const POPOVER_GAP_PX = 8;

interface PopoverProps {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  align?: "start" | "end";
  className?: string;
  disabled?: boolean;
  title?: string;
  children: (close: () => void) => ReactNode;
}

export function Popover({
  label,
  trigger,
  triggerClassName,
  align = "end",
  className,
  disabled = false,
  title,
  children,
}: PopoverProps) {
  const popoverId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const place = (event: ToggleEvent<HTMLDivElement>) => {
    const button = buttonRef.current;
    if (event.newState !== "open" || !button) return;
    const rect = button.getBoundingClientRect();
    event.currentTarget.style.top = `${rect.bottom + POPOVER_GAP_PX}px`;
    const { style } = event.currentTarget;
    if (align === "start") style.left = `${rect.left}px`;
    else style.right = `${window.innerWidth - rect.right}px`;
  };

  const close = () => document.getElementById(popoverId)?.hidePopover();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        popoverTarget={popoverId}
        aria-label={label}
        title={title ?? label}
        disabled={disabled}
        className={triggerClassName ?? buttonStyles({ size: "icon" })}
      >
        {trigger}
      </button>
      <div
        id={popoverId}
        popover="auto"
        onBeforeToggle={place}
        className={clsx(
          "fixed inset-auto m-0 rounded-lg border border-line bg-panel text-ink shadow-lifted",
          className,
        )}
      >
        {children(close)}
      </div>
    </>
  );
}
