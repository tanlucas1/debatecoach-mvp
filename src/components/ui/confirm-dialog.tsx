"use client";

import { clsx } from "clsx";
import { useEffect, useRef } from "react";
import { Button } from "./button";
import { panelStyles } from "./panel";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss?: () => void;
  focus?: "confirm" | "cancel";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  onDismiss = onCancel,
  focus = "cancel",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      (focus === "confirm" ? confirmRef : cancelRef).current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, focus]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onDismiss}
      aria-labelledby="confirm-title"
      className={clsx(
        panelStyles,
        "m-auto w-[min(26rem,calc(100%-2rem))] p-6 text-ink shadow-lifted backdrop:bg-black/50",
      )}
    >
      <h2 id="confirm-title" className="text-lg font-semibold">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button ref={cancelRef} variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button ref={confirmRef} variant="primary" size="sm" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
