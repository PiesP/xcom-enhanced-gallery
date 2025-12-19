/**
 * @fileoverview Media click event handler
 * Single delegated handler for detecting external media clicks.
 */

import { isGalleryInternalElement, isVideoControlElement } from '@shared/dom/utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '@shared/utils/events/core/dom-listener-context';
import { isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

/**
 * Handle media click event
 */
export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  // Early exits
  if (!options.enableMediaDetection) {
    return { handled: false, reason: 'Media detection disabled' };
  }

  const target = event.target;
  if (!isHTMLElement(target)) {
    return { handled: false, reason: 'Invalid target (not HTMLElement)' };
  }

  // Skip if gallery is open and target is internal
  if (gallerySignals.isOpen.value && isGalleryInternalElement(target)) {
    return { handled: false, reason: 'Gallery internal event' };
  }

  // Skip video control elements
  if (isVideoControlElement(target)) {
    return { handled: false, reason: 'Video control element' };
  }

  // Check if target is processable media
  if (!isProcessableMedia(target)) {
    return { handled: false, reason: 'Non-processable media target' };
  }

  // Block Twitter native gallery and handle ourselves
  event.stopImmediatePropagation();
  event.preventDefault();

  await handlers.onMediaClick(target, event);

  return {
    handled: true,
    reason: 'Media click handled',
  };
}
