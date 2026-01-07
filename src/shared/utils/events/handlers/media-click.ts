/**
 * @fileoverview Media click event handler
 * @description Single delegated handler for detecting and processing external media clicks.
 * Prevents Twitter's native gallery and triggers custom gallery behavior.
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
 * Handle media click event with multi-stage validation.
 * @param event - The mouse event triggered on a media element.
 * @param handlers - Event handler callbacks including onMediaClick.
 * @param options - Configuration options for media detection.
 * @returns Promise resolving to handling result with status and reason.
 */
export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  // Guard: Media detection disabled
  if (!options.enableMediaDetection) {
    return { handled: false, reason: 'Media detection disabled' };
  }

  const target = event.target;

  // Guard: Invalid target type
  if (!isHTMLElement(target)) {
    return { handled: false, reason: 'Invalid target (not HTMLElement)' };
  }

  // Guard: Gallery-internal event (when gallery is open)
  if (gallerySignals.isOpen.value && isGalleryInternalElement(target)) {
    return { handled: false, reason: 'Gallery internal event' };
  }

  // Guard: Video control element (skip interactive elements)
  if (isVideoControlElement(target)) {
    return { handled: false, reason: 'Video control element' };
  }

  // Guard: Non-processable media (final validation)
  if (!isProcessableMedia(target)) {
    return { handled: false, reason: 'Non-processable media target' };
  }

  // Handle media click: block native gallery and process with custom handler
  event.stopImmediatePropagation();
  event.preventDefault();

  await handlers.onMediaClick(target, event);

  return {
    handled: true,
    reason: 'Media click handled',
  };
}
