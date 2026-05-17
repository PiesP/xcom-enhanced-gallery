import { logger } from '@shared/logging/logger';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';
import { createComputed, createRoot } from 'solid-js';

const effectSafe = (fn: () => void): (() => void) =>
  createRoot((dispose) => {
    createComputed(fn);
    return dispose;
  });

let guardDispose: (() => void) | null = null;

export function startAmbientVideoGuard(): () => void {
  if (guardDispose)
    return () => {
      guardDispose?.();
      guardDispose = null;
    };

  guardDispose = effectSafe(() => {
    if (!gallerySignals.isOpen) return;

    const result = pauseAmbientVideosForGallery({ trigger: 'guard', reason: 'guard' });
    if (result.pausedCount > 0) {
      __DEV__ && logger.debug('[AmbientVideoGuard] Ambient pause triggered', result);
    }
  });

  return () => {
    guardDispose?.();
    guardDispose = null;
  };
}
