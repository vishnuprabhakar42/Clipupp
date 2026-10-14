export interface RetryImportOptions {
  /** Extra attempts after the first one fails. */
  retries?: number;
  /** Delay before the first retry; doubles on each further retry. */
  delayMs?: number;
}

/**
 * Retries a dynamic `import()` that rejected. A dropped request on a flaky
 * mobile connection usually succeeds on the next try, so the lazy islands
 * call their loaders through this before `next/dynamic` caches a rejection.
 * Rethrows the last error once every attempt has failed.
 */
export async function retryImport<T>(fn: () => Promise<T>, { retries = 2, delayMs = 400 }: RetryImportOptions = {}): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** attempt));
      attempt += 1;
    }
  }
}
