/**
 * @fileoverview AbortSignal cleanup utilities.
 * @description Helper functions for managing AbortSignal listener lifecycle.
 *
 * Consolidates common patterns for attaching abort listeners and ensuring proper cleanup.
 */

/**
 * Attach an abort listener and return a cleanup function.
 *
 * @param signal - AbortSignal to listen to (nullable).
 * @param onAbort - Callback to execute when signal aborts.
 * @param options - addEventListener options.
 * @returns Cleanup function that removes the listener.
 *
 * @example
 * ```typescript
 * const cleanup = attachAbortListener(signal, () => {
 *   console.log('Aborted!');
 * });
 *
 * // Later, before signal aborts:
 * cleanup();
 * ```
 */
export function attachAbortListener(
  signal: AbortSignal | null | undefined,
  onAbort: () => void,
  options?: AddEventListenerOptions
): () => void {
  if (!signal) {
    return () => {}; // noop cleanup for null/undefined signals
  }

  signal.addEventListener('abort', onAbort, options);

  return () => {
    try {
      signal.removeEventListener('abort', onAbort);
    } catch {
      // Defensive: ignore listener cleanup failures
      // (can happen if signal is from a different context)
    }
  };
}

/**
 * Execute cleanup when signal aborts (fire-and-forget pattern).
 *
 * Use this when you don't need to manually detach the listener.
 * The listener is automatically removed after first abort (once: true).
 *
 * @param signal - AbortSignal to listen to (nullable).
 * @param cleanup - Cleanup function to execute on abort.
 *
 * @example
 * ```typescript
 * const timerId = setTimeout(() => {...}, 1000);
 * onSignalAbort(signal, () => clearTimeout(timerId));
 * ```
 */
export function onSignalAbort(signal: AbortSignal | null | undefined, cleanup: () => void): void {
  if (!signal || signal.aborted) {
    return;
  }

  signal.addEventListener('abort', cleanup, { once: true });
}

/**
 * Check if a signal is null, undefined, or already aborted.
 *
 * Useful for early-exit checks in abort-aware functions.
 *
 * @param signal - AbortSignal to check (nullable).
 * @returns true if signal is absent or already aborted.
 *
 * @example
 * ```typescript
 * if (isSignalAborted(signal)) {
 *   throw new DOMException('Operation was aborted', 'AbortError');
 * }
 * ```
 */
export function isSignalAborted(signal: AbortSignal | null | undefined): boolean {
  return !signal || signal.aborted;
}
