"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { useTheme } from "@/lib/theme/use-theme";
import { SchemePicker, SchemeSwatches } from "./scheme-picker";

export function ThemeControls({ expanded = false }: { expanded?: boolean }) {
  const { scheme, mode, setTheme } = useTheme();
  const nextMode = mode === "dark" ? "light" : "dark";
  const selectScheme = (next: typeof scheme) => setTheme({ scheme: next });
  const Scheme = expanded ? SchemeSwatches : SchemePicker;

  return (
    <div className="flex items-center gap-2">
      <Scheme scheme={scheme} mode={mode} onSelect={selectScheme} />
      <Button
        size="icon"
        aria-label={`Switch to ${nextMode} mode`}
        onClick={() => setTheme({ mode: nextMode })}
      >
        {mode === "dark" ? <SunIcon /> : <MoonIcon />}
      </Button>
    </div>
  );
}
