import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { effectSafe } from '@shared/state/signals/signal-factory';
import { pauseActiveTwitterVideos } from './twitter-video-pauser';

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

    const result = pauseActiveTwitterVideos({ force: true });
    logger.debug('[AmbientVideoGuard] Forced ambient pause triggered by gallery open', result);
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
