/**
 * @fileoverview AbortSignal wiring helper for SubscriptionManager-based cleanup.
 *
 * Centralizes the common pattern used across event managers:
 * - Skip immediately when the signal is already aborted
 * - Register an abort listener (once)
 * - Return a cleanup function that removes the abort listener
 *
 * This keeps abort semantics consistent and reduces duplicated bookkeeping.
 */

export type AbortCleanup = (() => void) | null;

export function wireAbortSignal(
  signal: AbortSignal | undefined,
  onAbort: () => void
): {
  readonly shouldSkip: boolean;
  readonly cleanup: AbortCleanup;
} {
  if (!signal) {
    return { shouldSkip: false, cleanup: null };
  }

  if (signal.aborted) {
    return { shouldSkip: true, cleanup: null };
  }

  const handler = (): void => {
    onAbort();
  };

  try {
    signal.addEventListener('abort', handler, { once: true });
  } catch {
    // Ignore: some environments may not support AbortSignal event listeners.
    return { shouldSkip: false, cleanup: null };
  }

  return {
    shouldSkip: false,
    cleanup: () => {
      try {
        signal.removeEventListener('abort', handler);
      } catch {
        // Ignore
      }
    },
  };
}
