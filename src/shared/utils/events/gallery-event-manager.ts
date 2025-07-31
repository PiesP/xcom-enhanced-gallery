/**
 * @fileoverview 갤러리 전용 이벤트 관리
 */

import { logger } from '@shared/logging/logger';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { MediaClickDetector } from '@shared/utils/media/MediaClickDetector';
import type { MediaInfo } from '@shared/types/media.types';
import { addListener, removeEventListenersByContext } from './base-event-manager';

// 갤러리 이벤트 핸들러 타입
export interface EventHandlers {
  onMediaClick?: (mediaInfo: MediaInfo) => void;
  onKeyboardShortcut?: (key: string) => void;
  onGalleryClose?: () => void;
}

export interface GalleryEventOptions {
  enableKeyboardShortcuts?: boolean;
  enableMediaClick?: boolean;
  debug?: boolean;
}

// 갤러리 상태 확인
function checkGalleryOpen(): boolean {
  return galleryState.value.isOpen;
}

function checkInsideGallery(element: HTMLElement | null): boolean {
  if (!element) return false;
  return element.closest('[data-testid="gallery-container"]') !== null;
}

// 키보드 이벤트 처리
function handleKeyboardEvent(
  event: KeyboardEvent,
  handlers: EventHandlers,
  options: GalleryEventOptions
): void {
  if (!options.enableKeyboardShortcuts || !checkGalleryOpen()) return;

  const { key } = event;
  const validKeys = ['Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

  if (validKeys.includes(key)) {
    event.preventDefault();
    event.stopPropagation();
    handlers.onKeyboardShortcut?.(key);

    if (options.debug) {
      logger.debug(`갤러리 키보드 이벤트: ${key}`);
    }
  }
}

/**
 * 갤러리 이벤트 초기화
 */
export async function initializeGalleryEvents(
  handlers: EventHandlers,
  options: GalleryEventOptions = {}
): Promise<void> {
  const { enableKeyboardShortcuts = true, enableMediaClick = true, debug = false } = options;

  try {
    // 키보드 이벤트 리스너
    if (enableKeyboardShortcuts) {
      addListener(
        document,
        'keydown',
        event => handleKeyboardEvent(event as KeyboardEvent, handlers, options),
        { capture: true },
        'gallery-keyboard'
      );
    }

    // 미디어 클릭 이벤트
    if (enableMediaClick && handlers.onMediaClick) {
      const mediaClickDetector = new MediaClickDetector();
      addListener(
        document,
        'click',
        async event => {
          const target = event.target as HTMLElement;
          if (!checkInsideGallery(target)) return;

          const detectionResult = await mediaClickDetector.detectMediaFromClick(target);
          if (detectionResult && detectionResult.type !== 'none' && detectionResult.mediaUrl) {
            // MediaDetectionResult를 MediaInfo로 변환
            const mediaInfo: MediaInfo = {
              id: `detected-${Date.now()}`,
              url: detectionResult.mediaUrl,
              type: detectionResult.type as 'image' | 'video',
              filename: `media-${Date.now()}.${detectionResult.type === 'video' ? 'mp4' : 'jpg'}`,
            };

            handlers.onMediaClick?.(mediaInfo);
            if (debug) {
              logger.debug('갤러리 미디어 클릭 감지:', mediaInfo);
            }
          }
        },
        { passive: true },
        'gallery-media-click'
      );
    }

    // 갤러리 닫기 이벤트
    if (handlers.onGalleryClose) {
      addListener(
        document,
        'click',
        event => {
          const target = event.target as HTMLElement;
          if (target.matches('[data-testid="gallery-close"]')) {
            handlers.onGalleryClose?.();
            if (debug) {
              logger.debug('갤러리 닫기 이벤트 실행');
            }
          }
        },
        { passive: true },
        'gallery-close'
      );
    }

    if (debug) {
      logger.debug('갤러리 이벤트 초기화 완료');
    }
  } catch (error) {
    logger.error('갤러리 이벤트 초기화 실패:', error);
    throw error;
  }
}

/**
 * 갤러리 이벤트 정리
 */
export function cleanupGalleryEvents(): void {
  const contexts = ['gallery-keyboard', 'gallery-media-click', 'gallery-close'];

  let totalRemoved = 0;
  contexts.forEach(context => {
    const removed = removeEventListenersByContext(context);
    totalRemoved += removed;
  });

  logger.debug(`갤러리 이벤트 정리 완료: ${totalRemoved}개 리스너 제거`);
}

/**
 * 갤러리 이벤트 상태 조회
 */
export function getGalleryEventStatus() {
  return {
    galleryOpen: checkGalleryOpen(),
    timestamp: Date.now(),
  };
}
