export interface RateLimit {
  limit: number;
  windowMs: number;
}

// Counts requests per key in fixed windows. Each server instance keeps its own counts, so this
// stops bursts from one client rather than enforcing an exact global quota.
export function createRateLimiter({ limit, windowMs }: RateLimit) {
  const windows = new Map<string, { start: number; count: number }>();

  return function take(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
    for (const [other, window] of windows) {
      if (now - window.start >= windowMs) windows.delete(other);
    }
    const window = windows.get(key) ?? { start: now, count: 0 };
    windows.set(key, window);
    if (window.count >= limit) {
      return { allowed: false, retryAfterMs: window.start + windowMs - now };
    }
    window.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  };
}
