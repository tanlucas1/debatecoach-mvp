import { clsx } from "clsx";
import type { ReactNode } from "react";
import { panelStyles } from "./panel";

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className={clsx(panelStyles, "mx-auto max-w-xl p-5 text-center text-muted")}>{children}</p>
  );
}
