// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Media click event handler with multi-stage validation.
 * Single delegated handler for detecting and processing external media clicks.
 * Prevents Twitter's native gallery and triggers custom gallery behavior.
 */

import { isGalleryInternalElement, isVideoControlElement } from '@shared/dom/utils';
import type { EventHandlers, GalleryEventOptions } from '@shared/services/event-manager';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<void> {
  if (!options.enableMediaDetection) return;

  const target = event.target;
  if (!isHTMLElement(target)) return;

  if (gallerySignals.isOpen && isGalleryInternalElement(target)) return;
  if (isVideoControlElement(target)) return;
  if (!isProcessableMedia(target)) return;

  event.stopImmediatePropagation();
  event.preventDefault();

  try {
    await handlers.onMediaClick(target, event);
  } catch (error) {
    __DEV__ && console.warn('[MediaClick] onMediaClick failed', error);
  }
}
