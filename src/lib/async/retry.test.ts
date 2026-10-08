import { describe, expect, it, vi } from "vitest";
import { retry } from "./retry";

const busy = new Error("busy");
const fatal = new Error("fatal");
const options = { delaysMs: [0, 0], shouldRetry: (error: unknown) => error === busy };

describe("retry", () => {
  it("returns the first successful result", async () => {
    const task = vi.fn().mockRejectedValueOnce(busy).mockResolvedValue("ok");
    await expect(retry(task, options)).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("gives up after the last delay", async () => {
    const task = vi.fn().mockRejectedValue(busy);
    await expect(retry(task, options)).rejects.toBe(busy);
    expect(task).toHaveBeenCalledTimes(3);
  });

  it("does not retry errors it should not", async () => {
    const task = vi.fn().mockRejectedValue(fatal);
    await expect(retry(task, options)).rejects.toBe(fatal);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("stops once the request is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const task = vi.fn().mockRejectedValue(busy);
    await expect(retry(task, { ...options, signal: controller.signal })).rejects.toBe(busy);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
