/**
 * @fileoverview Media click event handler
 * PC-only policy: Detects media via mouse click
 * Distinguishes Twitter native gallery from our gallery
 */

import { logger } from '@shared/logging';
import { STABLE_SELECTORS } from '@/constants';
import { isHTMLElement } from '../../type-guards';
import { detectMediaFromClick, isProcessableMedia } from '../../media/media-click-detector';
import { isVideoControlElement, isGalleryInternalElement } from '../../utils';
import { gallerySignals } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '../core/event-context';

/**
 * Check if gallery is open
 */
function checkGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

/**
 * Check if click is inside gallery
 */
function checkInsideGallery(element: HTMLElement): boolean {
  return isGalleryInternalElement(element);
}

/**
 * Check if element is Twitter native gallery (to prevent duplicate execution)
 */
function isTwitterNativeGalleryElement(element: HTMLElement): boolean {
  // Exclude our gallery elements
  if (
    element.closest('.xeg-gallery-container, [data-xeg-gallery], .xeg-gallery') ||
    element.classList.contains('xeg-gallery-item') ||
    element.hasAttribute('data-xeg-gallery-type')
  ) {
    return false;
  }

  const selectors = [
    ...STABLE_SELECTORS.MEDIA_CONTAINERS,
    ...STABLE_SELECTORS.IMAGE_CONTAINERS,
    ...STABLE_SELECTORS.MEDIA_PLAYERS,
    ...STABLE_SELECTORS.MEDIA_LINKS,
    ...STABLE_SELECTORS.MEDIA_VIEWERS,
    'div[role="button"][aria-label*="재생"]',
    'div[role="button"][aria-label*="Play"]',
  ];

  return selectors.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    // Safely attempt URL constructor
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      // Fallback: Simple parsing
      const lastSlashIndex = url.lastIndexOf('/');
      if (lastSlashIndex === -1) return null;
      const filename = url.substring(lastSlashIndex + 1);
      return filename.length > 0 ? filename : null;
    }

    const urlObj = new URLConstructor(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    return filename && filename.length > 0 ? filename : null;
  } catch {
    return null;
  }
}

/**
 * Detect media from click event
 */
async function detectMediaFromEvent(event: MouseEvent): Promise<MediaInfo | null> {
  try {
    const target = event.target;
    if (!target || !isHTMLElement(target)) return null;

    const result = detectMediaFromClick(target);

    if (result?.type !== 'none' && result.mediaUrl) {
      const mediaInfo: MediaInfo = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: result.mediaUrl,
        originalUrl: result.mediaUrl,
        type: result.type === 'video' ? 'video' : result.type === 'image' ? 'image' : 'image',
        filename: extractFilenameFromUrl(result.mediaUrl) || 'untitled',
      };

      return mediaInfo;
    }
    return null;
  } catch (error) {
    logger.warn('Failed to detect media from click:', error);
    return null;
  }
}

/**
 * Handle media click event
 * Distinguishes Twitter native gallery from our gallery
 */
export async function handleMediaClick(
  event: MouseEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): Promise<EventHandlingResult> {
  try {
    const target = event.target;
    if (!isHTMLElement(target)) {
      return { handled: false, reason: 'Invalid target (not HTMLElement)' };
    }

    // **Phase 228.1: Fast path check (early exit)**
    // Check media container scope first - check first to remove unnecessary processing
    if (!options.enableMediaDetection) {
      return { handled: false, reason: 'Media detection disabled' };
    }

    // Check if click is inside gallery
    if (checkGalleryOpen() && checkInsideGallery(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    // Check if video control element
    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    // **Fast scope check: Early exit if outside media container**
    // This check is executed before isProcessableMedia() for performance improvement
    const mediaContainerSelectors = [
      ...STABLE_SELECTORS.IMAGE_CONTAINERS,
      ...STABLE_SELECTORS.MEDIA_PLAYERS,
      ...STABLE_SELECTORS.MEDIA_LINKS,
    ].join(', ');

    const isInMediaContainer = target.closest(mediaContainerSelectors);
    if (!isInMediaContainer) {
      return { handled: false, reason: 'Outside media container' };
    }

    if (!isProcessableMedia(target)) {
      return { handled: false, reason: 'Non-processable media target' };
    }

    // **Priority 1: Check and block Twitter native gallery elements (prevent duplicate execution)**
    if (isTwitterNativeGalleryElement(target)) {
      // Immediately block Twitter native event
      event.stopImmediatePropagation();
      event.preventDefault();

      // Try to detect media and open our gallery
      if (options.enableMediaDetection) {
        const mediaInfo = await detectMediaFromEvent(event);
        if (mediaInfo) {
          await handlers.onMediaClick(mediaInfo, target, event);
          return {
            handled: true,
            reason: 'Twitter blocked, our gallery opened',
            mediaInfo,
          };
        }
      }
      return { handled: true, reason: 'Twitter native gallery blocked' };
    }

    // **Priority 2: General media detection (for non-Twitter elements)**
    if (options.enableMediaDetection) {
      const mediaInfo = await detectMediaFromEvent(event);
      if (mediaInfo) {
        await handlers.onMediaClick(mediaInfo, target, event);
        return {
          handled: true,
          reason: 'Media click handled',
          mediaInfo,
        };
      }
    }

    return { handled: false, reason: 'No media detected' };
  } catch (error) {
    logger.error('Error handling media click:', error);
    return { handled: false, reason: `Error: ${error}` };
  }
}
