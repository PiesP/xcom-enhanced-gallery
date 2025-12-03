import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { effectSafe } from '@shared/state/signals/signal-factory';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';

let guardDispose: (() => void) | null = null;
let guardSubscribers = 0;

function ensureGuardEffect(): void {
  if (guardDispose) {
    return;
  }

  guardDispose = effectSafe(() => {
    if (!gallerySignals.isOpen.value) {
      return;
    }

    const result = pauseAmbientVideosForGallery({
      trigger: 'guard',
      reason: 'guard',
      force: true,
    });

    if (result.pausedCount > 0) {
      logger.debug('[AmbientVideoGuard] Ambient pause triggered by guard', result);
    }
  });
}

export function startAmbientVideoGuard(): () => void {
  guardSubscribers += 1;
  ensureGuardEffect();

  return () => {
    stopAmbientVideoGuard();
  };
}

export function stopAmbientVideoGuard(): void {
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

export function withAmbientVideoGuard(): { dispose: () => void } {
  const dispose = startAmbientVideoGuard();
  return {
    dispose,
  };
}
