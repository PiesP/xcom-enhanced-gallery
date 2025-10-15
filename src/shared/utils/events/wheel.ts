/**
 * Wheel listener utilities abiding by R2 policy
 * - addWheelListener: passive by default
 */

export type WheelHandler = (event: WheelEvent) => void | boolean;

export interface WheelListenerOptions {
  capture?: boolean;
  passive?: boolean; // default true for addWheelListener
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
