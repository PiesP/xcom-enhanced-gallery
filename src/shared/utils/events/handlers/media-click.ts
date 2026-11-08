// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media click event handler with multi-stage validation.
 * Single delegated handler for detecting and processing external media clicks.
 * Prevents Twitter's native gallery and triggers custom gallery behavior.
 */

import { DEFAULT_SETTINGS } from '@constants/settings';
import { getTypedSettingOr, tryGetSettings } from '@shared/container/settings-registry';
import {
  isGalleryInternalElement,
  isGalleryRecoveryActive,
  isVideoClickAllowed,
} from '@shared/dom/utils';
import { logger } from '@shared/logging/logger';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { getMediaClickTarget } from '@shared/utils/media/media-click-target';

/** Resolve video click mode safely, falling back when settings unavailable */
function resolveVideoClickMode(): VideoClickMode {
  const settings = tryGetSettings();
  if (!settings) {
    return DEFAULT_SETTINGS.gallery.videoClickMode;
  }
  return getTypedSettingOr('gallery.videoClickMode', DEFAULT_SETTINGS.gallery.videoClickMode);
}

export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<void> {
  if (!options.enableMediaDetection) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  // Recovery is modeless: host and recovery controls retain their native click routing.
  if (isGalleryRecoveryActive()) {
    return;
  }

  // The native modal owns gallery input and makes the host page inert. Reject
  // its media here; retain the outside-target guard for event routing that
  // precedes modal presentation. handleBackgroundClick owns gallery background clicks.
  if (gallerySignals.isOpen) {
    if (isGalleryInternalElement(target)) {
      return;
    }
    handlers.onGalleryClose();
    event.stopImmediatePropagation();
    event.preventDefault();
    return;
  }

  // Gallery is closed — locate the nearest HTML owner of an SVG hit while
  // retaining the original event and its control ancestry.
  const mediaTarget = getMediaClickTarget(event);
  if (!mediaTarget) {
    return;
  }

  // Check video click mode from user settings — single decision point
  // for all video-click behavior (block-all / block-controls-only / allow-all).
  const videoMode = resolveVideoClickMode();
  if (!isVideoClickAllowed(mediaTarget, () => event.composedPath(), videoMode)) {
    return;
  }

  if (!isProcessableMedia(mediaTarget, event)) {
    return;
  }

  event.stopImmediatePropagation();
  event.preventDefault();

  try {
    await handlers.onMediaClick(mediaTarget, event);
  } catch (error) {
    logger.warn('onMediaClick failed', error);
  }
}
