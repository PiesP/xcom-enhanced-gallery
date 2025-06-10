/**
 * Video State Manager
 *
 * 동영상 재생으로 인한 DOM 변화와 요소 소실 문제를 해결하는
 * 상태 관리 및 갤러리 트리거 유지 시스템
 */

import { logger } from '@infrastructure/logging/logger';
import type { MediaInfo } from '@shared/types/media.types';

interface TweetMediaCache {
  tweetId: string;
  containerSelector: string;
  mediaItems: MediaInfo[];
  extractedAt: number;
  originalThumbnails: {
    element: HTMLElement;
    src: string;
    position: DOMRect;
  }[];
}

interface GalleryTriggerButton {
  element: HTMLElement;
  tweetId: string;
  mediaCache: TweetMediaCache;
}

export class VideoStateManager {
  private static instance: VideoStateManager;
  private mediaCache = new Map<string, TweetMediaCache>();
  private galleryTriggers = new Map<string, GalleryTriggerButton>();
  private mutationObserver: MutationObserver | null = null;
  private isObserving = false;

  private constructor() {}

  public static getInstance(): VideoStateManager {
    VideoStateManager.instance ??= new VideoStateManager();
    return VideoStateManager.instance;
  }

  /**
   * 트윗의 미디어 정보를 캐시에 저장
   */
  public cacheMediaForTweet(
    tweetId: string,
    tweetContainer: HTMLElement,
    mediaItems: MediaInfo[]
  ): void {
    const containerSelector = this.generateContainerSelector(tweetContainer);

    // 현재 썸네일 요소들의 정보 저장
    const originalThumbnails = Array.from(tweetContainer.querySelectorAll('img'))
      .filter(img => img.src.includes('pbs.twimg.com'))
      .map(img => ({
        element: img as HTMLElement,
        src: img.src,
        position: img.getBoundingClientRect(),
      }));

    const cache: TweetMediaCache = {
      tweetId,
      containerSelector,
      mediaItems,
      extractedAt: Date.now(),
      originalThumbnails,
    };

    this.mediaCache.set(tweetId, cache);

    logger.debug('VideoStateManager: 미디어 캐시 저장됨', {
      tweetId,
      mediaCount: mediaItems.length,
      thumbnailCount: originalThumbnails.length,
    });
  }

  /**
   * 캐시된 미디어 정보 가져오기
   */
  public getCachedMedia(tweetId: string): TweetMediaCache | null {
    const cache = this.mediaCache.get(tweetId);

    // 캐시가 10분 이상 오래된 경우 무효화
    if (cache && Date.now() - cache.extractedAt > 10 * 60 * 1000) {
      this.mediaCache.delete(tweetId);
      return null;
    }

    return cache ?? null;
  }

  /**
   * 갤러리 트리거 버튼 생성 및 등록
   */
  public createGalleryTrigger(
    tweetContainer: HTMLElement,
    tweetId: string,
    onTrigger: (mediaItems: MediaInfo[], clickedIndex: number) => void
  ): void {
    const cache = this.getCachedMedia(tweetId);
    if (!cache) {
      logger.warn('VideoStateManager: 캐시된 미디어가 없어 트리거 생성 불가');
      return;
    }

    // 기존 트리거가 있으면 제거
    this.removeGalleryTrigger(tweetId);

    // 갤러리 트리거 버튼 생성
    const triggerButton = document.createElement('div');
    triggerButton.className = 'xeg-gallery-trigger newly-created';
    triggerButton.setAttribute('data-tweet-id', tweetId);
    triggerButton.setAttribute('role', 'button');
    triggerButton.setAttribute('tabindex', '0');
    triggerButton.setAttribute('aria-label', '갤러리 열기');

    // 갤러리 아이콘 추가
    triggerButton.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
    `;

    // 클릭 이벤트 (마우스 및 키보드)
    const handleTrigger = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();

      logger.info('VideoStateManager: 갤러리 트리거 활성화됨', { tweetId });
      onTrigger(cache.mediaItems, 0);
    };

    triggerButton.addEventListener('click', handleTrigger);
    triggerButton.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handleTrigger(event);
      }
    });

    // 3초 후 newly-created 클래스 제거
    setTimeout(() => {
      triggerButton.classList.remove('newly-created');
    }, 3000);

    // 트리거 버튼 추가
    tweetContainer.appendChild(triggerButton);

    // 트리거 정보 저장
    this.galleryTriggers.set(tweetId, {
      element: triggerButton,
      tweetId,
      mediaCache: cache,
    });

    logger.debug('VideoStateManager: 갤러리 트리거 생성됨', { tweetId });
  }

  /**
   * 갤러리 트리거 제거
   */
  public removeGalleryTrigger(tweetId: string): void {
    const trigger = this.galleryTriggers.get(tweetId);
    if (trigger?.element.parentNode) {
      trigger.element.remove();
      this.galleryTriggers.delete(tweetId);
      logger.debug('VideoStateManager: 갤러리 트리거 제거됨', { tweetId });
    }
  }

  /**
   * DOM 변화 감지 시작
   */
  public startDOMObserver(
    onVideoPlayStart: (tweetId: string, videoElement: HTMLVideoElement) => void
  ): void {
    if (this.isObserving) {
      return;
    }

    this.mutationObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // 동영상 요소 추가 감지
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              const videos =
                element.tagName === 'VIDEO'
                  ? [element as HTMLVideoElement]
                  : Array.from(element.querySelectorAll('video'));

              videos.forEach(video => {
                this.handleVideoElementAdded(video, onVideoPlayStart);
              });
            }
          });

          // 이미지 썸네일 제거 감지
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (element.tagName === 'IMG') {
                const imgElement = element as HTMLImageElement;
                if (imgElement.src.includes('pbs.twimg.com')) {
                  this.handleThumbnailRemoved(element);
                }
              }
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.isObserving = true;
    logger.info('VideoStateManager: DOM 변화 감지 시작');
  }

  /**
   * DOM 변화 감지 중지
   */
  public stopDOMObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
      this.isObserving = false;
      logger.info('VideoStateManager: DOM 변화 감지 중지');
    }
  }

  /**
   * 동영상 요소 추가 처리
   */
  private handleVideoElementAdded(
    video: HTMLVideoElement,
    onVideoPlayStart: (tweetId: string, videoElement: HTMLVideoElement) => void
  ): void {
    const tweetContainer = video.closest('[data-testid="tweet"]') as HTMLElement;
    if (!tweetContainer) return;

    const tweetId = this.extractTweetId(tweetContainer);
    if (!tweetId) return;

    // 동영상 재생 이벤트 감지
    video.addEventListener('play', () => {
      logger.debug('VideoStateManager: 동영상 재생 시작 감지', { tweetId });
      onVideoPlayStart(tweetId, video);
    });

    // 동영상 일시정지 이벤트 감지
    video.addEventListener('pause', () => {
      logger.debug('VideoStateManager: 동영상 일시정지 감지', { tweetId });
    });
  }

  /**
   * 썸네일 제거 처리
   */
  private handleThumbnailRemoved(thumbnail: HTMLElement): void {
    const tweetContainer = thumbnail.closest('[data-testid="tweet"]') as HTMLElement;
    if (!tweetContainer) return;

    const tweetId = this.extractTweetId(tweetContainer);
    if (!tweetId) return;

    logger.debug('VideoStateManager: 썸네일 제거 감지, 트리거 생성 검토', { tweetId });

    // 캐시된 미디어가 있고 현재 트리거가 없으면 생성
    const cache = this.getCachedMedia(tweetId);
    const existingTrigger = this.galleryTriggers.get(tweetId);

    if (cache && !existingTrigger) {
      // 약간의 지연 후 트리거 생성 (DOM 안정화 대기)
      setTimeout(() => {
        this.createGalleryTrigger(tweetContainer, tweetId, (mediaItems, clickedIndex) => {
          // 이벤트 발생 (갤러리 오픈)
          const event = new CustomEvent('xeg-gallery-trigger', {
            detail: { mediaItems, clickedIndex, tweetId },
          });
          document.dispatchEvent(event);
        });
      }, 100);
    }
  }

  /**
   * 트윗 ID 추출
   */
  private extractTweetId(tweetContainer: HTMLElement): string | null {
    const tweetLinks = tweetContainer.querySelectorAll('a[href*="/status/"]');
    for (const link of tweetLinks) {
      const href = (link as HTMLAnchorElement).href;
      const match = href.match(/\/status\/(\d+)/);
      if (match?.[1]) {
        return match[1];
      }
    }
    return null;
  }

  /**
   * 컨테이너 선택자 생성
   */
  private generateContainerSelector(container: HTMLElement): string {
    const testId = container.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${testId}"]`;
    }

    const className = container.className;
    if (className) {
      return `.${className.split(' ')[0]}`;
    }

    return container.tagName.toLowerCase();
  }

  /**
   * 모든 캐시 정리 (갤러리 닫기 시 사용)
   */
  public clearAllCache(): void {
    this.mediaCache.clear();
    logger.debug('VideoStateManager: 모든 미디어 캐시 정리됨');
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.stopDOMObserver();

    // 모든 트리거 제거
    this.galleryTriggers.forEach(trigger => {
      if (trigger.element.parentNode) {
        trigger.element.remove();
      }
    });

    this.galleryTriggers.clear();
    this.mediaCache.clear();

    logger.info('VideoStateManager: 정리 완료');
  }
}
