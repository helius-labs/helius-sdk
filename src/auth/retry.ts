import { sleep } from "./utils";
import { getHttpStatus } from "./getHttpStatus";

export function isRetryableError(error: unknown): boolean {
  const status = getHttpStatus(error);
  if (status !== undefined) return status >= 500;
  // Network errors (no status code) are retryable
  return true;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!isRetryableError(error)) {
        throw lastError;
      }
      if (i < maxRetries - 1) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}
