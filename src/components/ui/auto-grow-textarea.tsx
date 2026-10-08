"use client";

import { clsx } from "clsx";
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

type AutoGrowTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows">;

export function AutoGrowTextarea({ value, className, ...props }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    const borders = element.offsetHeight - element.clientHeight;
    element.style.height = `${element.scrollHeight + borders}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      className={clsx("resize-none overflow-y-auto", className)}
      {...props}
    />
  );
}
