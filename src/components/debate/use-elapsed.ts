"use client";

import { useEffect, useState } from "react";

const TICK_MS = 250;

export function useElapsed(since: number): number {
  const [now, setNow] = useState(since);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return Math.max(0, now - since);
}
