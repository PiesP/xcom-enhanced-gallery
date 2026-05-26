// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { logger } from '@shared/logging/logger';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { pauseAmbientVideosForGallery } from '@shared/utils/media/ambient-video-coordinator';
import { createEffectRoot } from '@shared/utils/solid/accessor-utils';

let guardDispose: (() => void) | null = null;

export function startAmbientVideoGuard(): () => void {
  if (guardDispose) {
    return () => {
      guardDispose?.();
    };
  }

  let active = true;
  guardDispose = createEffectRoot(() => {
    if (!gallerySignals.isOpen) return;

    const result = pauseAmbientVideosForGallery({ trigger: 'guard', reason: 'guard' });
    if (result.pausedCount > 0) {
      __DEV__ && logger.debug('[AmbientVideoGuard] Ambient pause triggered', result);
    }
  });

  return () => {
    if (!active) return;
    active = false;
    guardDispose?.();
    guardDispose = null;
  };
}
