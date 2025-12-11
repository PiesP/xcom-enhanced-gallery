import { logger } from '@shared/logging';















































































import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';

let guardDispose: (() => void) | null = null;
let guardSubscribers = 0;

function ensureGuardEffect(): void {
  if (guardDispose) {
    return;
  }

  // Subscribe directly to the signal to avoid cross-runtime createEffect
  // issues in test environments where multiple Solid runtimes may be loaded.
  // createSignalSafe.subscribe returns a dispose function that is compatible
  // with the root lifecycle semantics we already use here.
  guardDispose = gallerySignals.isOpen.subscribe((isOpen) => {
    if (!isOpen) return;

    const result = pauseAmbientVideosForGallery({ trigger: 'guard', reason: 'guard' });
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
