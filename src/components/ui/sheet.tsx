"use client";

import { clsx } from "clsx";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";
import { CloseIcon } from "./icons";
import { panelStyles } from "./panel";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={titleId}
      className={clsx(
        panelStyles,
        "mx-0 mt-auto mb-0 w-full max-w-none rounded-b-none text-ink backdrop:bg-black/50 open:flex open:max-h-[85dvh] open:flex-col",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 id={titleId} className="font-semibold">
          {title}
        </h2>
        <Button size="icon" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
