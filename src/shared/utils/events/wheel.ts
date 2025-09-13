/**
 * Wheel listener utilities abiding by R2 policy
 * - addWheelListener: passive by default
 * - ensureWheelLock: conditionally preventDefault when handler returns true
 */

export type WheelHandler = (event: WheelEvent) => void | boolean;

export interface WheelListenerOptions {
  capture?: boolean;
  passive?: boolean; // default true for addWheelListener; ensureWheelLock will force false
  signal?: AbortSignal;
  context?: string; // reserved for future logging/hooks
}

/**
 * Add a wheel listener with passive=true by default.
 * Returns a cleanup function. If an AbortSignal is provided, auto-cleans on abort.
 */
export function addWheelListener(
  target: EventTarget,
  handler: WheelHandler,
  options: WheelListenerOptions = {}
): () => void {
  const { capture = false, passive = true, signal } = options;

  const listener = (e: Event) => {
    handler(e as WheelEvent);
  };

  target.addEventListener('wheel', listener as EventListener, { capture, passive });

  const cleanup = () => {
    target.removeEventListener('wheel', listener as EventListener, capture);
  };

  if (signal) {
    if (signal.aborted) cleanup();
    else signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}

/**
 * Ensure wheel lock: registers a wheel listener with passive=false.
 * If the provided handler returns true, preventDefault is applied to consume the event.
 * Returns a cleanup function. Supports AbortSignal.
 */
export function ensureWheelLock(
  target: EventTarget,
  handler: WheelHandler,
  options: WheelListenerOptions = {}
): () => void {
  const { capture = false, signal } = options;

  const listener = (e: Event) => {
    const we = e as WheelEvent;
    const result = handler(we);
    if (result === true) {
      // Only consume when explicitly requested by handler
      we.preventDefault();
    }
  };

  // passive must be false when we may preventDefault
  target.addEventListener('wheel', listener as EventListener, { capture, passive: false });

  const cleanup = () => {
    target.removeEventListener('wheel', listener as EventListener, capture);
  };

  if (signal) {
    if (signal.aborted) cleanup();
    else signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}
