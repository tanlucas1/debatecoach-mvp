import { describe, expect, it } from "vitest";
import { createLimiter, wait } from "./limit";

describe("createLimiter", () => {
  it("never runs more tasks at once than allowed, and keeps their order", async () => {
    const run = createLimiter(2);
    let active = 0;
    let peak = 0;
    const started: number[] = [];

    const results = await Promise.all(
      [0, 1, 2, 3, 4].map((id) =>
        run(async () => {
          started.push(id);
          active += 1;
          peak = Math.max(peak, active);
          await wait(10);
          active -= 1;
          return id;
        }),
      ),
    );

    expect(peak).toBe(2);
    expect(started).toEqual([0, 1, 2, 3, 4]);
    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it("frees the slot when a task fails", async () => {
    const run = createLimiter(1);
    await expect(run(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(run(async () => "next")).resolves.toBe("next");
  });
});
