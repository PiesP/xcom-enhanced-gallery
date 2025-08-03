/**
 * @fileoverview OptimizedMediaExtractor - TDD REFACTOR 단계 실제 구현
 * @description 기존 중복 구현들을 통합한 최적화된 미디어 추출기
 * - MediaClickDetector: 미디어 클릭 감지
 * - MediaExtractionService: 2단계 추출 전략
 * - TwitterAPIExtractor: API 기반 추  priva  private async extractFromAPI(
    _tweetInfo: TweetInfo,
    _element: HTMLElement,
    extractionId: string,
  ): Promise<{ success: boolean; mediaItems: MediaInfo[]; clickedIndex: number }> {
    try {
      logger.debug(`[OptimizedMediaExtractor] ${extractionId}: API 추출 시도`);

      // 현재는 기본 구현 (실제 TwitterAPI 통합은 다음 단계)
      // TODO: TwitterAPI.getTweetMedias(tweetInfo.tweetId) 통합

      return { success: false, mediaItems: [], clickedIndex: -1 };
    } catch (error) {
      logger.warn(`[OptimizedMediaExtractor] API 추출 실패:`, error);
      return { success: false, mediaItems: [], clickedIndex: -1 };
    }
  }  private async extractFromDOM(
    element: HTMLElement,
    container: HTMLElement,
    _extractionId: string,
  ): Promise<{ success: boolean; mediaItems: MediaInfo[]; clickedIndex: number }> {I(
    tweetInfo: TweetInfo,
    element: HTMLElement,
    _extractionId: string,
  ): Promise<{ success: boolean; mediaItems: MediaInfo[]; clickedIndex: number }> {- DOMDirectExtractor: DOM 직접 추출
 */

import type { MediaInfo, TweetInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging/logger';

/**
 * 미디어 추출 결과
 */
export interface MediaExtractionResult {
  success: boolean;
  mediaItems: MediaInfo[];
  clickedIndex: number;
  tweetInfo?: TweetInfo;
  confidence: number;
  processingTime: number;
}

/**
 * 페이지 타입 감지 결과
 */
export interface PageTypeDetectionResult {
  type: 'POST' | 'PROFILE' | 'HOME' | 'SEARCH' | 'UNKNOWN';
  confidence: number;
}

/**
 * 미디어 감지 결과 (MediaClickDetector 통합)
 */
interface _MediaDetectionResult {
  type: 'video' | 'image' | 'none';
  element: HTMLElement | null;
  mediaUrl?: string;
  confidence: number;
  method: string;
}

/**
 * 최적화된 미디어 추출기
 * TDD 기반으로 기존 중복 구현들을 통합
 * - MediaClickDetector: 미디어 클릭 감지
 * - MediaExtractionService: 2단계 추출 전략
 * - TwitterAPIExtractor: API 기반 추출
 * - DOMDirectExtractor: DOM 직접 추출
 */
export class OptimizedMediaExtractor {
  private static instance: OptimizedMediaExtractor;

  public static getInstance(): OptimizedMediaExtractor {
    OptimizedMediaExtractor.instance ??= new OptimizedMediaExtractor();
    return OptimizedMediaExtractor.instance;
  }

  constructor() {
    logger.debug('[OptimizedMediaExtractor] 인스턴스 생성됨');
  }

  /**
   * 클릭된 요소에서 미디어 추출
   * 통합된 2단계 전략: API 우선 → DOM 백업
   */
  async extractFromClick(
    element: HTMLElement,
    container?: HTMLElement
  ): Promise<MediaExtractionResult> {
    const startTime = performance.now();
    const extractionId = this.generateExtractionId();
    logger.info(`[OptimizedMediaExtractor] ${extractionId}: 통합 추출 시작`);

    try {
      // 1. 처리 가능한 미디어인지 확인 (MediaClickDetector 통합)
      if (!this.isProcessableMedia(element)) {
        logger.debug(`[OptimizedMediaExtractor] ${extractionId}: 처리 불가능한 미디어`);
        return this.createResult(false, [], -1, null, 0, performance.now() - startTime);
      }

      // 2. 트윗 정보 추출
      const tweetInfo = await this.extractTweetInfo(element);

      // 3. API 우선 추출 (트윗 정보 있는 경우)
      if (tweetInfo?.tweetId) {
        logger.debug(`[OptimizedMediaExtractor] ${extractionId}: API 추출 시도`);
        const apiResult = await this.extractFromAPI(tweetInfo, element, extractionId);
        if (apiResult.success) {
          return this.createResult(
            true,
            apiResult.mediaItems,
            apiResult.clickedIndex,
            tweetInfo,
            0.9,
            performance.now() - startTime
          );
        }
      }

      // 4. DOM 직접 추출 (백업 전략)
      logger.debug(`[OptimizedMediaExtractor] ${extractionId}: DOM 직접 추출`);
      const domResult = await this.extractFromDOM(element, container || element, extractionId);

      if (domResult.success) {
        return this.createResult(
          true,
          domResult.mediaItems,
          domResult.clickedIndex,
          tweetInfo,
          0.7,
          performance.now() - startTime
        );
      }

      return this.createResult(false, [], -1, tweetInfo, 0, performance.now() - startTime);
    } catch (error) {
      logger.error(`[OptimizedMediaExtractor] ${extractionId}: 추출 중 오류:`, error);
      return this.createResult(false, [], -1, null, 0, performance.now() - startTime);
    }
  }

  /**
   * 페이지 타입 감지
   * URL과 DOM 구조를 분석하여 현재 페이지 타입 결정
   */
  async detectPageType(url: string): Promise<PageTypeDetectionResult> {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // URL 기반 분석
      if (pathname.includes('/status/')) {
        return { type: 'POST', confidence: 0.9 };
      } else if (pathname.match(/^\/[^/]+$/)) {
        return { type: 'PROFILE', confidence: 0.8 };
      } else if (pathname === '/' || pathname === '/home') {
        return { type: 'HOME', confidence: 0.9 };
      } else if (pathname.includes('/search')) {
        return { type: 'SEARCH', confidence: 0.8 };
      }

      // DOM 구조 기반 추가 분석
      const mediaViewerExists = document.querySelector('[data-testid="photoViewerLayer"]');
      if (mediaViewerExists) {
        return { type: 'POST', confidence: 0.95 };
      }
    } catch (error) {
      logger.warn('[OptimizedMediaExtractor] 페이지 타입 감지 중 오류:', error);
    }

    return { type: 'UNKNOWN', confidence: 0 };
  }

  /**
   * 트윗 정보 추출
   * 다양한 전략을 사용하여 트윗 ID와 사용자 정보 추출
   */
  async extractTweetInfo(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      // 전략 1: 클릭된 요소에서 트윗 정보 찾기
      const tweetInfo = this.extractFromClickedElement(element);
      if (tweetInfo) return tweetInfo;

      // 전략 2: URL에서 트윗 ID 추출
      const urlInfo = this.extractFromURL();
      if (urlInfo) return urlInfo;

      // 전략 3: DOM 구조 탐색
      const domInfo = this.extractFromDOMStructure(element);
      if (domInfo) return domInfo;

      return null;
    } catch (error) {
      logger.warn('[OptimizedMediaExtractor] 트윗 정보 추출 실패:', error);
      return null;
    }
  }

  // ==================== 내부 메서드 ====================

  /**
   * 처리 가능한 미디어 요소인지 확인 (MediaClickDetector 통합)
   */
  private isProcessableMedia(target: HTMLElement): boolean {
    if (!target) return false;

    logger.debug('[OptimizedMediaExtractor] 미디어 처리 가능성 확인:', {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
    });

    // 이미지 요소 확인
    if (target.tagName === 'IMG') return true;

    // 비디오 요소 확인
    if (target.tagName === 'VIDEO') return true;

    // 미디어 컨테이너 확인
    const mediaSelectors = [
      '[data-testid*="media"]',
      '[data-testid*="video"]',
      '[data-testid*="image"]',
      '.css-1dbjc4n img',
      '[role="img"]',
    ];

    return mediaSelectors.some(selector => {
      try {
        return target.matches(selector) || target.querySelector(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * API 기반 미디어 추출
   */
  private async extractFromAPI(
    tweetInfo: TweetInfo,
    element: HTMLElement,
    extractionId: string
  ): Promise<{ success: boolean; mediaItems: MediaInfo[]; clickedIndex: number }> {
    try {
      logger.debug(`[OptimizedMediaExtractor] ${_extractionId}: API 추출 시도`);

      // 현재는 기본 구현 (실제 TwitterAPI 통합은 다음 단계)
      // TODO: TwitterAPI.getTweetMedias(tweetInfo.tweetId) 통합

      return { success: false, mediaItems: [], clickedIndex: -1 };
    } catch (error) {
      logger.warn(`[OptimizedMediaExtractor] API 추출 실패:`, error);
      return { success: false, mediaItems: [], clickedIndex: -1 };
    }
  }

  /**
   * DOM 직접 추출
   */
  private async extractFromDOM(
    element: HTMLElement,
    container: HTMLElement,
    extractionId: string
  ): Promise<{ success: boolean; mediaItems: MediaInfo[]; clickedIndex: number }> {
    try {
      const mediaItems: MediaInfo[] = [];
      let clickedIndex = -1;

      // 이미지 추출
      const images = this.extractImagesFromDOM(container);
      mediaItems.push(...images);

      // 비디오 추출
      const videos = this.extractVideosFromDOM(container);
      mediaItems.push(...videos);

      // 클릭된 인덱스 계산
      clickedIndex = this.calculateClickedIndex(element, mediaItems);

      if (mediaItems.length === 0) {
        return { success: false, mediaItems: [], clickedIndex: -1 };
      }

      return {
        success: true,
        mediaItems,
        clickedIndex: Math.max(0, clickedIndex),
      };
    } catch (error) {
      logger.error(`[OptimizedMediaExtractor] DOM 추출 실패:`, error);
      return { success: false, mediaItems: [], clickedIndex: -1 };
    }
  }

  /**
   * DOM에서 이미지 추출
   */
  private extractImagesFromDOM(container: HTMLElement): MediaInfo[] {
    const images: MediaInfo[] = [];
    const imageSelectors = [
      'img[src*="pbs.twimg.com"]',
      'img[src*="media"]',
      '[data-testid*="image"] img',
      '.css-1dbjc4n img',
    ];

    const searchContainer =
      container.closest('article') || container.closest('[data-testid="tweet"]') || container;

    imageSelectors.forEach(selector => {
      const imgElements = searchContainer.querySelectorAll(
        selector
      ) as NodeListOf<HTMLImageElement>;
      imgElements.forEach((img, index) => {
        if (img.src && !images.some(item => item.url === img.src)) {
          images.push({
            id: `img_${Date.now()}_${index}`,
            url: img.src,
            type: 'image',
            filename: this.extractFilenameFromUrl(img.src),
            thumbnailUrl: img.src,
            originalUrl: img.src.replace(/&name=\w+$/, '&name=orig'),
          });
        }
      });
    });

    return images;
  }

  /**
   * DOM에서 비디오 추출
   */
  private extractVideosFromDOM(container: HTMLElement): MediaInfo[] {
    const videos: MediaInfo[] = [];
    const videoSelectors = ['video[src]', 'video source[src]', '[data-testid*="video"] video'];

    const searchContainer =
      container.closest('article') || container.closest('[data-testid="tweet"]') || container;

    videoSelectors.forEach(selector => {
      const videoElements = searchContainer.querySelectorAll(
        selector
      ) as NodeListOf<HTMLVideoElement>;
      videoElements.forEach((video, index) => {
        const src = video.src || video.querySelector('source')?.src;
        if (src && !videos.some(item => item.url === src)) {
          videos.push({
            id: `video_${Date.now()}_${index}`,
            url: src,
            type: 'video',
            filename: this.extractFilenameFromUrl(src),
            thumbnailUrl: video.poster || '',
            originalUrl: src,
          });
        }
      });
    });

    return videos;
  }

  /**
   * 클릭된 인덱스 계산
   */
  private calculateClickedIndex(element: HTMLElement, mediaItems: MediaInfo[]): number {
    // 클릭된 요소와 가장 가까운 미디어 아이템 찾기
    const clickedImg = element.querySelector('img') || (element.closest('img') as HTMLImageElement);
    const clickedVideo =
      element.querySelector('video') || (element.closest('video') as HTMLVideoElement);

    if (clickedImg) {
      const index = mediaItems.findIndex(item => item.url === clickedImg.src);
      if (index !== -1) return index;
    }

    if (clickedVideo) {
      const src = clickedVideo.src || clickedVideo.querySelector('source')?.src;
      const index = mediaItems.findIndex(item => item.url === src);
      if (index !== -1) return index;
    }

    return 0; // 기본값
  }

  /**
   * 클릭된 요소에서 트윗 정보 추출
   */
  private extractFromClickedElement(element: HTMLElement): TweetInfo | null {
    const tweetContainer = element.closest('article') || element.closest('[data-testid="tweet"]');
    if (!tweetContainer) return null;

    // 링크에서 트윗 ID 추출
    const tweetLink = tweetContainer.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (tweetLink?.href) {
      const tweetIdMatch = tweetLink.href.match(/\/status\/(\d+)/);
      if (tweetIdMatch) {
        return {
          tweetId: tweetIdMatch[1],
          username: this.extractUsernameFromContainer(tweetContainer as HTMLElement),
        };
      }
    }

    return null;
  }

  /**
   * URL에서 트윗 정보 추출
   */
  private extractFromURL(): TweetInfo | null {
    const tweetIdMatch = window.location.pathname.match(/\/status\/(\d+)/);
    if (tweetIdMatch) {
      return {
        tweetId: tweetIdMatch[1],
        username: this.extractUsernameFromURL(),
      };
    }
    return null;
  }

  /**
   * DOM 구조에서 트윗 정보 추출
   */
  private extractFromDOMStructure(element: HTMLElement): TweetInfo | null {
    // 현재 표시된 트윗에서 정보 추출
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    for (const tweet of tweets) {
      if (tweet.contains(element)) {
        const link = tweet.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
        if (link?.href) {
          const tweetIdMatch = link.href.match(/\/status\/(\d+)/);
          if (tweetIdMatch) {
            return {
              tweetId: tweetIdMatch[1],
              username: this.extractUsernameFromContainer(tweet as HTMLElement),
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * 컨테이너에서 사용자명 추출
   */
  private extractUsernameFromContainer(container: HTMLElement): string {
    const usernameEl = container.querySelector('[data-testid="User-Name"] a') as HTMLAnchorElement;
    if (usernameEl?.href) {
      const usernameMatch = usernameEl.href.match(/twitter\.com\/([^/]+)/);
      if (usernameMatch) return usernameMatch[1];
    }
    return '';
  }

  /**
   * URL에서 사용자명 추출
   */
  private extractUsernameFromURL(): string {
    const pathParts = window.location.pathname.split('/');
    return pathParts[1] || '';
  }

  /**
   * URL에서 파일명 추출
   */
  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      return filename || `media_${Date.now()}`;
    } catch {
      return `media_${Date.now()}`;
    }
  }

  /**
   * 결과 생성 헬퍼
   */
  private createResult(
    success: boolean,
    mediaItems: MediaInfo[],
    clickedIndex: number,
    tweetInfo: TweetInfo | null,
    confidence: number,
    processingTime: number
  ): MediaExtractionResult {
    return {
      success,
      mediaItems,
      clickedIndex,
      tweetInfo: tweetInfo || undefined,
      confidence,
      processingTime,
    };
  }

  /**
   * 추출 ID 생성
   */
  private generateExtractionId(): string {
    return `extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default OptimizedMediaExtractor;
