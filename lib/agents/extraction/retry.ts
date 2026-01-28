import "server-only";

export type RetryInfo = {
  attempt: number;
  delayMs: number;
  error: unknown;
};

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (info: RetryInfo) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  jitter: boolean
): number {
  const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const bounded = Math.min(maxDelayMs, exponential);
  if (!jitter) return Math.floor(bounded);
  const random = 0.5 + Math.random();
  return Math.floor(bounded * random);
}

export async function withRetries<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const jitter = options.jitter ?? true;

  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      return await fn();
    } catch (error) {
      const shouldRetry =
        attempt < maxAttempts &&
        (options.shouldRetry ? options.shouldRetry(error, attempt) : true);
      if (!shouldRetry) {
        throw error;
      }
      const delayMs = getDelayMs(attempt, baseDelayMs, maxDelayMs, jitter);
      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs);
    }
  }
}
