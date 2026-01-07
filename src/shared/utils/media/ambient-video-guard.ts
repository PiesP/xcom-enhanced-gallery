import { logger } from '@shared/logging/logger';

import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';

/**
 * Module: Ambient Video Guard
 *
 * Manages automatic pausing of ambient videos when the gallery opens.
 * Uses a reference-counted subscription pattern to handle multiple consumers.
 *
 * @module ambient-video-guard
 */

let guardDispose: (() => void) | null = null;
let guardSubscribers = 0;

/**
 * Initializes the gallery open signal subscription for ambient video pausing.
 *
 * Subscribes directly to the signal to avoid cross-runtime issues with
 * Solid.js `createEffect` in test environments where multiple runtimes
 * may be loaded. The `subscribe()` method returns a dispose function
 * compatible with root lifecycle semantics.
 *
 * @internal
 */
function ensureGuardEffect(): void {
  if (guardDispose) {
    return;
  }

  guardDispose = gallerySignals.isOpen.subscribe((isOpen: boolean) => {
    if (!isOpen) return;

    const result = pauseAmbientVideosForGallery({
      trigger: 'guard',
      reason: 'guard',
    });

    if (result.pausedCount <= 0) {
      return;
    }

    if (__DEV__) {
      logger.debug('[AmbientVideoGuard] Ambient pause triggered by guard', result);
    }
  });
}

/**
 * Starts the ambient video guard with reference counting.
 *
 * Increments the subscriber count and ensures the guard effect is initialized.
 * Multiple calls to this function are safe; they will share the same underlying
 * signal subscription.
 *
 * Returns a cleanup function that should be called to deregister this consumer.
 * When all consumers have called their cleanup functions, the effect is disposed.
 *
 * @example
 * ```typescript
 * const cleanup = startAmbientVideoGuard();
 * // ... later
 * cleanup();
 * ```
 *
 * @returns A cleanup function to stop the guard for this consumer
 */
export function startAmbientVideoGuard(): () => void {
  guardSubscribers += 1;
  ensureGuardEffect();

  return () => {
    stopAmbientVideoGuard();
  };
}

/**
 * Stops the ambient video guard for one consumer.
 *
 * Decrements the subscriber count. When the count reaches zero, the underlying
 * signal subscription is cleaned up to prevent memory leaks.
 *
 * @internal
 */
function stopAmbientVideoGuard(): void {
  if (guardSubscribers === 0) {
    return;
  }

  guardSubscribers -= 1;
  if (guardSubscribers > 0) {
    return;
  }

  guardDispose?.();
  guardDispose = null;
}
