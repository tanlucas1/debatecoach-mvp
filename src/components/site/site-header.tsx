import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeControls } from "@/components/theme/theme-controls";
import { HeaderMenu } from "./header-menu";
import { APP_CONTAINER } from "./layout";

interface SiteHeaderProps {
  container?: string;
  actions?: ReactNode;
  settings?: ReactNode;
  menuSettings?: ReactNode;
}

export function SiteHeader({
  container = APP_CONTAINER,
  actions,
  settings,
  menuSettings = settings,
}: SiteHeaderProps) {
  return (
    <header className="border-b border-line">
      <div className={clsx("flex items-center justify-between gap-3 py-3", container)}>
        <Logo />
        <div className="flex items-center gap-3">
          {actions}
          <div className="flex items-center gap-3 max-sm:hidden">
            {settings}
            <ThemeControls />
          </div>
          <div className="sm:hidden">
            <HeaderMenu>
              {menuSettings}
              <ThemeControls expanded />
            </HeaderMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
