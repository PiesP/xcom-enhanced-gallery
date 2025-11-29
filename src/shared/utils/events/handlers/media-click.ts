/**
 * @fileoverview Media click event handler
 * Single delegated handler for detecting external media clicks.
 */

import { isGalleryInternalElement, isVideoControlElement } from '@shared/dom/utils';
import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '@shared/utils/events/core/event-context';
import {
  detectMediaFromClick,
  isProcessableMedia,
  type MediaDetectionResult,
} from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    const filename = new URL(url).pathname.split('/').pop();
    return filename && filename.length > 0 ? filename : null;
  } catch {
    return null;
  }
}

/**
 * Convert detection result to MediaInfo
 */
function toMediaInfo(result: MediaDetectionResult): MediaInfo | null {
  if (result.type === 'none' || !result.mediaUrl) {
    return null;
  }

  return {
    id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    url: result.mediaUrl,
    originalUrl: result.mediaUrl,
    type: result.type === 'video' ? 'video' : 'image',
    filename: extractFilenameFromUrl(result.mediaUrl) || 'untitled',
  };
}

/**
 * Resolve media info from click event
 */
async function resolveMediaInfo(event: MouseEvent): Promise<MediaInfo | null> {
  const target = event.target;
  if (!target || !isHTMLElement(target)) return null;

  try {
    const result = detectMediaFromClick(target);
    return toMediaInfo(result);
  } catch (error) {
    logger.warn('[MediaClick] Failed to detect media:', error);
    return null;
  }
}

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

  // Detect and resolve media info
  const mediaInfo = await resolveMediaInfo(event);
  if (!mediaInfo) {
    return { handled: false, reason: 'No media detected' };
  }

  // Block Twitter native gallery and handle ourselves
  event.stopImmediatePropagation();
  event.preventDefault();

  await handlers.onMediaClick(mediaInfo, target, event);

  return {
    handled: true,
    reason: 'Media click handled',
    mediaInfo,
  };
}
