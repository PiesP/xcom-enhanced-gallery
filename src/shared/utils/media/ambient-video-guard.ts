import { logger } from '@shared/logging/logger';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { effectSafe } from '@shared/state/signals/signal-factory';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';

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
