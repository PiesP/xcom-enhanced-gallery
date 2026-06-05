// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media click event handler with multi-stage validation.
 * Single delegated handler for detecting and processing external media clicks.
 * Prevents Twitter's native gallery and triggers custom gallery behavior.
 */

import { getTypedSettingOr, tryGetSettings } from '@shared/container/container';
import { isGalleryInternalElement, isVideoClickAllowed } from '@shared/dom/utils';
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
  if (!isHTMLElement(target)) return;

  if (gallerySignals.isOpen && isGalleryInternalElement(target)) return;

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
    __DEV__ && console.warn('[MediaClick] onMediaClick failed', error);
  }
}
