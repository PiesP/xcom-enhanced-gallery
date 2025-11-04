/**
 * @fileoverview 미디어 클릭 이벤트 핸들러
 * PC-only 정책: 마우스 클릭으로 미디어 감지
 * 트위터 네이티브 갤러리와 우리 갤러리 구분
 */

import { logger } from '@shared/logging';
import { STABLE_SELECTORS } from '../../../../constants';
import { isHTMLElement } from '../../type-guards';
import { detectMediaFromClick, isProcessableMedia } from '../../media/media-click-detector';
import { isVideoControlElement, isGalleryInternalElement } from '../../utils';
import { gallerySignals } from '../../../state/signals/gallery.signals';
import type { MediaInfo } from '../../../types/media.types';
import type {
  EventHandlers,
  EventHandlingResult,
  GalleryEventOptions,
} from '../core/event-context';

/**
 * 갤러리 열린 상태 확인
 */
function checkGalleryOpen(): boolean {
  return gallerySignals.isOpen.value;
}

/**
 * 갤러리 내부 클릭 확인
 */
function checkInsideGallery(element: HTMLElement): boolean {
  return isGalleryInternalElement(element);
}

/**
 * 트위터 네이티브 갤러리 요소인지 확인 (중복 실행 방지용)
 */
function isTwitterNativeGalleryElement(element: HTMLElement): boolean {
  // 우리의 갤러리 요소는 제외
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
 * URL에서 파일명 추출
 */
function extractFilenameFromUrl(url: string): string | null {
  try {
    // URL 생성자를 안전하게 시도
    let URLConstructor: typeof URL | undefined;

    if (typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function') {
      URLConstructor = globalThis.URL;
    } else if (typeof window !== 'undefined' && typeof window.URL === 'function') {
      URLConstructor = window.URL;
    }

    if (!URLConstructor) {
      // Fallback: 간단한 파싱
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
 * 클릭 이벤트에서 미디어 감지
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
 * 미디어 클릭 이벤트 처리
 * 트위터 네이티브 갤러리와 우리 갤러리를 구분하여 처리
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

    // **Phase 228.1: 빠른 경로 체크 (조기 종료)**
    // 미디어 컨테이너 범위 확인 - 가장 먼저 검사하여 불필요한 처리 제거
    if (!options.enableMediaDetection) {
      return { handled: false, reason: 'Media detection disabled' };
    }

    // 갤러리 내부 클릭인지 확인
    if (checkGalleryOpen() && checkInsideGallery(target)) {
      return { handled: false, reason: 'Gallery internal event' };
    }

    // 비디오 컨트롤 클릭인지 확인
    if (isVideoControlElement(target)) {
      return { handled: false, reason: 'Video control element' };
    }

    // **빠른 범위 체크: 미디어 컨테이너 범위 밖이면 조기 종료**
    // 이 체크는 isProcessableMedia()보다 먼저 실행되어 성능 개선
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

    // **우선순위 1: 트위터 네이티브 갤러리 요소 확인 및 차단 (중복 실행 방지)**
    if (isTwitterNativeGalleryElement(target)) {
      // 트위터 네이티브 이벤트를 즉시 차단
      event.stopImmediatePropagation();
      event.preventDefault();

      // 미디어 감지 후 우리의 갤러리 열기 시도
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

    // **우선순위 2: 일반 미디어 감지 (트위터 요소가 아닌 경우)**
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
