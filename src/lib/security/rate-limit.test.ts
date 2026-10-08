import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit in a window, then blocks until the window ends", () => {
    const take = createRateLimiter({ limit: 2, windowMs: 1000 });

    expect(take("a", 0).allowed).toBe(true);
    expect(take("a", 100).allowed).toBe(true);
    expect(take("a", 200)).toEqual({ allowed: false, retryAfterMs: 800 });
    expect(take("a", 1000).allowed).toBe(true);
  });

  it("counts each key on its own", () => {
    const take = createRateLimiter({ limit: 1, windowMs: 1000 });

    expect(take("a", 0).allowed).toBe(true);
    expect(take("b", 0).allowed).toBe(true);
    expect(take("a", 10).allowed).toBe(false);
  });
});
