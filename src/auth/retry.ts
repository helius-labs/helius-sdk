import { sleep } from "./utils";

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const match = error.message.match(/API error \((\d+)\)/);
    if (match) {
      const status = parseInt(match[1], 10);
      return status >= 500;
    }
    // Network errors (no status code) are retryable
    return true;
  }
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
