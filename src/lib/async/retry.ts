import { wait } from "./limit";

interface RetryOptions {
  delaysMs: readonly number[];
  shouldRetry: (error: unknown) => boolean;
  signal?: AbortSignal;
}

export async function retry<T>(
  task: () => Promise<T>,
  { delaysMs, shouldRetry, signal }: RetryOptions,
): Promise<T> {
  for (const delay of delaysMs) {
    try {
      return await task();
    } catch (error) {
      if (signal?.aborted || !shouldRetry(error)) throw error;
      await wait(delay);
    }
  }
  return task();
}
