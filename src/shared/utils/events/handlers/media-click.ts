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
import { detectMediaFromClick, isProcessableMedia } from '@shared/utils/media/media-click-detector';
import { isHTMLElement } from '@shared/utils/types/guards';

function extractFilenameFromUrl(url: string): string | null {
  try {
    const filename = new URL(url).pathname.split('/').pop();
    return filename && filename.length > 0 ? filename : null;
  } catch {
    return null;
  }
}

async function resolveMediaInfo(event: MouseEvent): Promise<MediaInfo | null> {
  try {
    const target = event.target;
    if (!target || !isHTMLElement(target)) return null;

    const result = detectMediaFromClick(target);
    if (!result || result.type === 'none' || !result.mediaUrl) {
      return null;
    }

    return {
      id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      url: result.mediaUrl,
      originalUrl: result.mediaUrl,
      type: result.type === 'video' ? 'video' : result.type === 'image' ? 'image' : 'image',
      filename: extractFilenameFromUrl(result.mediaUrl) || 'untitled',
    } satisfies MediaInfo;
  } catch (error) {
    logger.warn('Failed to detect media from click:', error);
    return null;
  }
}

export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions,
): Promise<EventHandlingResult> {
  try {
    if (!options.enableMediaDetection) {
      return { handled: false, reason: 'Media detection disabled' };
    }

    const target = event.target;
    if (!isHTMLElement(target)) {
      return { handled: false, reason: 'Invalid target (not HTMLElement)' };
    }

    if (gallerySignals.isOpen.value && isGalleryInternalElement(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    if (!isProcessableMedia(target)) {
      return { handled: false, reason: 'Non-processable media target' };
    }

    const mediaInfo = await resolveMediaInfo(event);
    if (mediaInfo) {
      // Block Twitter native gallery and handle it ourselves
      event.stopImmediatePropagation();
      event.preventDefault();

      await handlers.onMediaClick(mediaInfo, target, event);
      return {
        handled: true,
        reason: 'Media click handled',
        mediaInfo,
      };
    }

    return { handled: false, reason: 'No media detected' };
  } catch (error) {
    logger.error('Error handling media click:', error);
    return { handled: false, reason: `Error: ${error}` };
  }
}
