"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type ColorMode,
  type ColorScheme,
  type Theme,
} from "./config";

const listeners = new Set<() => void>();

const SEPARATOR = "|";

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readSnapshot(): string {
  const { scheme, mode } = document.documentElement.dataset;
  return [scheme, mode].join(SEPARATOR);
}

const serverSnapshot = [DEFAULT_THEME.scheme, DEFAULT_THEME.mode].join(SEPARATOR);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.scheme = theme.scheme;
  root.dataset.mode = theme.mode;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage can be blocked; the theme still applies for this visit.
  }

  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => serverSnapshot);
  const [scheme, mode] = snapshot.split(SEPARATOR) as [ColorScheme, ColorMode];

  const setTheme = useCallback(
    (next: Partial<Theme>) => applyTheme({ scheme, mode, ...next }),
    [scheme, mode],
  );

  return { scheme, mode, setTheme };
}
