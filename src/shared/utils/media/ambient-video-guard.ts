import { logger } from '@shared/logging/logger';

import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';

/**
 * Manages automatic pausing of ambient videos when gallery opens.
 * Uses reference-counted subscriptions to handle multiple consumers.
 */

let guardDispose: (() => void) | null = null;
let guardSubscribers = 0;

/**
 * Initializes gallery open signal subscription for ambient video pausing.
 * @internal
 */
const ensureGuardEffect = (): void => {
  if (guardDispose) return;

  guardDispose = gallerySignals.isOpen.subscribe((isOpen: boolean) => {
    if (!isOpen) return;

    const result = pauseAmbientVideosForGallery({
      trigger: 'guard',
      reason: 'guard',
    });

    if (result.pausedCount <= 0) return;

    if (__DEV__) {
      logger.debug('[AmbientVideoGuard] Ambient pause triggered by guard', result);
    }
  });
};

/**
 * Starts the ambient video guard with reference counting.
 * Returns a cleanup function for this consumer.
 *
 * @returns Cleanup function to stop the guard
 */
export const startAmbientVideoGuard = (): (() => void) => {
  guardSubscribers += 1;
  ensureGuardEffect();
  return stopAmbientVideoGuard;
};

/**
 * Stops the ambient video guard for one consumer.
 * @internal
 */
const stopAmbientVideoGuard = (): void => {
  if (guardSubscribers === 0) return;

  guardSubscribers -= 1;
  if (guardSubscribers > 0) return;

  guardDispose?.();
  guardDispose = null;
};
