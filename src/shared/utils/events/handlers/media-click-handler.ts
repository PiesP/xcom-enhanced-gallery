/**
 * @fileoverview Media click event handler
 * Single delegated handler for detecting external media clicks.
 */

import { logger } from '@shared/logging';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { STABLE_SELECTORS, CSS } from '@/constants';
import { detectMediaFromClick, isProcessableMedia } from '../../media/media-click-detector';
import { isHTMLElement } from '../../type-guards';
import { isGalleryInternalElement, isVideoControlElement } from '../../utils';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '../core/event-context';

const OUR_GALLERY_SCOPE = CSS.INTERNAL_SELECTORS.join(', ');
const TWITTER_NATIVE_SELECTORS = [
  ...STABLE_SELECTORS.MEDIA_CONTAINERS,
  ...STABLE_SELECTORS.IMAGE_CONTAINERS,
  ...STABLE_SELECTORS.MEDIA_PLAYERS,
  ...STABLE_SELECTORS.MEDIA_LINKS,
  ...STABLE_SELECTORS.MEDIA_VIEWERS,
  'div[role="button"][aria-label*="재생"]',
  'div[role="button"][aria-label*="Play"]',
];

let mediaContainerSelectorCache: string | null = null;

function isGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

function isInsideOurGallery(element: HTMLElement): boolean {
  return isGalleryInternalElement(element);
}

function getMediaContainerSelector(): string {
  if (!mediaContainerSelectorCache) {
    mediaContainerSelectorCache = [
      ...STABLE_SELECTORS.IMAGE_CONTAINERS,
      ...STABLE_SELECTORS.MEDIA_PLAYERS,
      ...STABLE_SELECTORS.MEDIA_LINKS,
    ].join(', ');
  }
  return mediaContainerSelectorCache;
}

function isTwitterNativeGalleryElement(element: HTMLElement): boolean {
  if (
    element.closest(OUR_GALLERY_SCOPE) ||
    element.classList.contains('xeg-gallery-item') ||
    element.hasAttribute('data-xeg-gallery-type')
  ) {
    return false;
  }

  return TWITTER_NATIVE_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

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
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  try {
    if (!options.enableMediaDetection) {
      return { handled: false, reason: 'Media detection disabled' };
    }

    const target = event.target;
    if (!isHTMLElement(target)) {
      return { handled: false, reason: 'Invalid target (not HTMLElement)' };
    }

    if (isGalleryOpen() && isInsideOurGallery(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    if (!target.closest(getMediaContainerSelector())) {
      return { handled: false, reason: 'Outside media container' };
    }

    if (!isProcessableMedia(target)) {
      return { handled: false, reason: 'Non-processable media target' };
    }

    if (isTwitterNativeGalleryElement(target)) {
      event.stopImmediatePropagation();
      event.preventDefault();

      const mediaInfo = await resolveMediaInfo(event);
      if (mediaInfo) {
        await handlers.onMediaClick(mediaInfo, target, event);
        return {
          handled: true,
          reason: 'Twitter native gallery blocked',
          mediaInfo,
        };
      }

      return { handled: true, reason: 'Twitter native gallery blocked' };
    }

    const mediaInfo = await resolveMediaInfo(event);
    if (mediaInfo) {
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

export function resetMediaClickHandlerCache(): void {
  mediaContainerSelectorCache = null;
}
