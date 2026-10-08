"use client";

import { useCallback, useSyncExternalStore, type RefObject } from "react";

function subscribe(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}

const isActive = () => document.fullscreenElement !== null;
const isSupported = () => document.fullscreenEnabled;
const onServer = () => false;

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const active = useSyncExternalStore(subscribe, isActive, onServer);
  const supported = useSyncExternalStore(subscribe, isSupported, onServer);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void ref.current?.requestFullscreen().catch(() => undefined);
  }, [ref]);

  return { supported, active, toggle };
}
