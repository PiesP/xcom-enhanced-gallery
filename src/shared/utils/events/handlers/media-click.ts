// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media click event handler with multi-stage validation.
 * Single delegated handler for detecting and processing external media clicks.
 * Prevents Twitter's native gallery and triggers custom gallery behavior.
 */

import { getTypedSettingOr, tryGetSettings } from '@shared/container/container';
import { isGalleryInternalElement, isVideoClickAllowed } from '@shared/dom/utils';
import { logger } from '@shared/logging/logger';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { VideoClickMode } from '@shared/types/settings.types';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

/** Resolve video click mode safely, falling back when settings unavailable */
function resolveVideoClickMode(): VideoClickMode {
  const settings = tryGetSettings();
  if (!settings) return 'block-controls-only';
  return getTypedSettingOr('gallery.videoClickMode', 'block-controls-only');
}

export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<void> {
  if (!options.enableMediaDetection) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  // Gallery is open — close on outside click (defensive: the fixed overlay covers
  // the viewport, so this fires only if an element behind the overlay receives a
  // click via higher z-index or click-through. The primary close mechanism for
  // gallery background clicks is handleBackgroundClick in the bubble phase.)
  if (gallerySignals.isOpen) {
    if (isGalleryInternalElement(target)) return;
    handlers.onGalleryClose();
    event.stopImmediatePropagation();
    event.preventDefault();
    return;
  }

  // Gallery is closed — check if this is a media click that should open it.
  // Narrow to HTMLElement: video click detection needs HTMLElement-specific APIs.
  if (!isHTMLElement(target)) return;

  // Check video click mode from user settings — single decision point
  // for all video-click behavior (block-all / block-controls-only / allow-all).
  const videoMode = resolveVideoClickMode();
  if (!isVideoClickAllowed(target, () => event.composedPath(), videoMode)) return;

  if (!isProcessableMedia(target, event)) return;

  event.stopImmediatePropagation();
  event.preventDefault();

  try {
    await handlers.onMediaClick(target, event);
  } catch (error) {
    logger.warn('onMediaClick failed', error);
  }
}
