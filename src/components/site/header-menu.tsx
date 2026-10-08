"use client";

import { clsx } from "clsx";
import { useId, type ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { SettingsIcon } from "@/components/ui/icons";
import { panelStyles } from "@/components/ui/panel";

export function HeaderMenu({ children }: { children: ReactNode }) {
  const menuId = useId();

  return (
    <>
      <button
        type="button"
        popoverTarget={menuId}
        aria-label="Settings"
        className={buttonStyles({ size: "icon" })}
      >
        <SettingsIcon />
      </button>
      <div
        id={menuId}
        popover="auto"
        className={clsx(
          panelStyles,
          "fixed inset-auto top-16 right-4 m-0 flex-col items-end gap-3 p-3 text-ink shadow-lifted open:flex",
        )}
      >
        {children}
      </div>
    </>
  );
}
