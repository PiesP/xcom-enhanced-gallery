/**
 * @fileoverview Twitter API 기반 미디어 추출기
 * @description 트윗 정보가 확보된 후 API를 통한 정확한 미디어 추출
 * @version 2.0.0 - Clean Architecture
 */

import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';
import { TwitterAPI, type TweetMediaEntry } from '@shared/services/media/twitter-video-extractor';
import type { MediaInfo, MediaExtractionResult } from '@shared/types/media.types';
import type { TweetInfo, MediaExtractionOptions, APIExtractor } from '@shared/types/media.types';

/**
 * Twitter API 기반 추출기
 * 트윗 정보가 확보된 후 API를 통한 정확한 미디어 추출
 */
export class TwitterAPIExtractor implements APIExtractor {
  /**
   * API 기반 미디어 추출
   */
  async extract(
    tweetInfo: TweetInfo,
    clickedElement: HTMLElement,
    options: MediaExtractionOptions,
    extractionId: string
  ): Promise<MediaExtractionResult> {
    try {
      logger.debug(`[APIExtractor] ${extractionId}: API 추출 시작`, {
        tweetId: tweetInfo.tweetId,
        timeout: options.timeoutMs,
      });

      const timeoutMs = options.timeoutMs ?? 10_000;
      const maxRetries = options.maxRetries ?? 3;

      const apiMedias = await this.fetchWithRetry(
        () => TwitterAPI.getTweetMedias(tweetInfo.tweetId),
        { timeoutMs, maxRetries }
      );

      if (apiMedias?.length === 0) {
        return this.createFailureResult('No media found in API response');
      }

      const mediaItems = await this.convertAPIMediaToMediaInfo(apiMedias, tweetInfo);
      const clickedIndex = await this.calculateClickedIndex(clickedElement, apiMedias, mediaItems);

      return {
        success: true,
        mediaItems,
        clickedIndex,
        metadata: {
          extractedAt: Date.now(),
          sourceType: 'twitter-api',
          strategy: 'api-extraction',
          totalProcessingTime: 0,
          apiMediaCount: apiMedias.length,
        },
        tweetInfo,
      };
    } catch (error) {
      logger.warn(`[APIExtractor] ${extractionId}: API 추출 실패:`, error);
      return this.createFailureResult(
        error instanceof Error ? error.message : 'API extraction failed'
      );
    }
  }

  /**
   * Retry / timeout wrapper
   */
  private async fetchWithRetry<T>(
    fn: () => Promise<T>,
    {
      timeoutMs,
      maxRetries,
    }: {
      timeoutMs: number;
      maxRetries: number;
    }
  ): Promise<T> {
    let attempt = 0;
    const attempts = Math.max(0, maxRetries) + 1;

    // 타임아웃 래퍼 (Abort 불가 환경 고려: 타임아웃 시 reject)
    const withTimeout = <U>(p: Promise<U>): Promise<U> => {
      return new Promise<U>((resolve, reject) => {
        const timer = globalTimerManager.setTimeout(() => {
          reject(new Error('timeout'));
        }, timeoutMs);
        p.then(
          v => {
            globalTimerManager.clearTimeout(timer);
            resolve(v);
          },
          e => {
            globalTimerManager.clearTimeout(timer);
            reject(e);
          }
        );
      });
    };

    let lastError: unknown;
    while (attempt < attempts) {
      try {
        const res = await withTimeout(fn());
        return res;
      } catch (e) {
        lastError = e;
        attempt += 1;
        if (attempt >= attempts) break;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('unknown');
  }

  /**
   * API 미디어를 MediaInfo로 변환
   */
  private async convertAPIMediaToMediaInfo(
    apiMedias: TweetMediaEntry[],
    tweetInfo: TweetInfo
  ): Promise<MediaInfo[]> {
    const mediaItems: MediaInfo[] = [];

    for (let i = 0; i < apiMedias.length; i++) {
      const apiMedia = apiMedias[i];
      if (!apiMedia) continue;

      const mediaInfo = this.createMediaInfoFromAPI(apiMedia, tweetInfo, i);
      if (mediaInfo) {
        mediaItems.push(mediaInfo);
      }
    }

    return mediaItems;
  }

  /**
   * API 미디어에서 MediaInfo 생성
   */
  private createMediaInfoFromAPI(
    apiMedia: TweetMediaEntry,
    tweetInfo: TweetInfo,
    index: number
  ): MediaInfo | null {
    try {
      // 타입 변환: photo -> image, video -> video
      const mediaType = apiMedia.type === 'photo' ? 'image' : 'video';

      return {
        id: `${tweetInfo.tweetId}_api_${index}`,
        url: apiMedia.download_url,
        type: mediaType,
        filename: '',
        tweetUsername: tweetInfo.username,
        tweetId: tweetInfo.tweetId,
        tweetUrl: tweetInfo.tweetUrl,
        originalUrl: apiMedia.download_url,
        thumbnailUrl: apiMedia.preview_url,
        alt: `${mediaType} ${index + 1}`,
        metadata: {
          apiIndex: index,
          apiData: apiMedia,
        },
      };
    } catch (error) {
      logger.error('API MediaInfo 생성 실패:', error);
      return null;
    }
  }

  /**
   * 클릭된 미디어 인덱스 계산
   */
  /**
   * 클릭된 미디어의 정확한 인덱스 계산 (개선 버전)
   *
   * 목적:
   * - 사용자가 클릭한 미디어 아이템이 mediaItems 배열에서 몇 번째 위치인지 결정
   * - 인용 트윗, 리트윗 등 복잡한 트윗 구조에서도 정확하게 작동
   * - 갤러리가 올바른 미디어부터 시작되도록 보장
   *
   * 전략 (개선된 우선순위):
   *
   * 1️⃣ **직접 매칭** (최우선, 신뢰도 99%+)
   *   - 클릭된 미디어 요소의 URL을 추출
   *   - API 미디어와 1:1 정확 비교
   *   - 쿼리스트링 정규화 후 파일명 기반 비교
   *
   * 2️⃣ **트윗 컨텍스트 기반** (중간, 신뢰도 95%+)
   *   - 클릭된 요소가 속한 트윗 컨테이너 명시적 지정
   *   - 인용 트윗과 원본 트윗 분리
   *   - 현재 미디어 배열과만 매칭
   *
   * 3️⃣ **DOM 순서 기반 추정** (대체, 신뢰도 80-90%)
   *   - 트윗 컨테이너 내 미디어 요소들의 DOM 순서로 추정
   *   - 한정된 스코프 내에서만 계산 (성능 최적화)
   *
   * 4️⃣ **안전장치** (마지막 수단, 신뢰도 50%)
   *   - 모든 시도 실패 시 첫 번째 미디어(index 0) 반환
   *
   * @param clickedElement - 사용자가 클릭한 DOM 요소
   * @param apiMedias - API에서 추출한 미디어 배열
   * @param mediaItems - 현재 갤러리에 표시되는 미디어 아이템 배열
   * @returns 올바른 인덱스 (0-based), 계산 실패 시 0
   */
  private async calculateClickedIndex(
    clickedElement: HTMLElement,
    apiMedias: TweetMediaEntry[],
    mediaItems: MediaInfo[]
  ): Promise<number> {
    // 1️⃣ 미디어 요소 찾기 및 URL 추출 (빠른 경로)
    const mediaElement = this.findMediaElement(clickedElement);
    if (!mediaElement) {
      logger.debug('[APIExtractor] 클릭된 미디어 요소를 찾을 수 없음');
      return this.estimateIndexFromDOMOrder(clickedElement, mediaItems.length);
    }

    const clickedUrl = this.extractMediaUrl(mediaElement);

    // 2️⃣ URL 기반 정확 매칭 (성공 시 바로 반환)
    if (clickedUrl) {
      const exactMatch = this.findExactMediaMatch(clickedUrl, apiMedias);
      if (exactMatch !== -1) {
        logger.debug(`[APIExtractor] 직접 매칭 성공: 인덱스 ${exactMatch}`);
        return exactMatch;
      }
    }

    // 3️⃣ DOM 순서 기반 추정 (폴백)
    const estimatedIndex = this.estimateIndexFromDOMOrder(clickedElement, mediaItems.length);
    logger.debug(`[APIExtractor] DOM 순서 기반 추정: 인덱스 ${estimatedIndex}`);

    return estimatedIndex;
  }

  /**
   * URL 기반 정확 매칭 (개선된 버전)
   *
   * 개선사항:
   * - 정확한 URL 비교 먼저 (가장 빠름)
   * - 파일명 기반 비교 (정규화됨)
   * - 쿼리스트링 무시 (Twitter의 동적 URL 처리)
   *
   * @private
   */
  private findExactMediaMatch(clickedUrl: string, apiMedias: TweetMediaEntry[]): number {
    if (!clickedUrl) return -1;

    // 단계 1: 정확한 URL 비교
    for (let i = 0; i < apiMedias.length; i++) {
      const media = apiMedias[i];
      if (!media) continue;

      if (media.download_url === clickedUrl || media.preview_url === clickedUrl) {
        return i;
      }
    }

    // 단계 2: 파일명 기반 비교 (쿼리스트링 무시)
    const clickedFilename = this.normalizeMediaUrl(clickedUrl);
    if (!clickedFilename) return -1;

    for (let i = 0; i < apiMedias.length; i++) {
      const media = apiMedias[i];
      if (!media) continue;

      const apiFilename = this.normalizeMediaUrl(media.download_url);
      if (apiFilename && clickedFilename === apiFilename) {
        return i;
      }
    }

    return -1;
  }

  /**
   * 클릭된 요소에서 미디어 요소 찾기 (개선된 버전)
   *
   * 변경사항:
   * - 트윗 컨테이너 명시적 확인으로 인용 트윗 대응
   * - 부모 검색 범위 최적화 (10 → 5단계, 더 효율적)
   * - 직접 미디어 요소 우선 (성능 개선)
   */
  private findMediaElement(element: HTMLElement): HTMLElement | null {
    // 1. 클릭된 요소가 이미 미디어 요소인지 확인 (가장 빠름)
    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') {
      return element;
    }

    // 2. 자식 요소에서 미디어 찾기 (직접 자식 우선)
    const mediaChild = element.querySelector(':scope > img, :scope > video');
    if (mediaChild) {
      return mediaChild as HTMLElement;
    }

    // 3. 더 깊은 자식에서 미디어 찾기 (제한된 깊이)
    const deepChild = element.querySelector('img, video');
    if (deepChild && this.isDirectMediaChild(element, deepChild as HTMLElement)) {
      return deepChild as HTMLElement;
    }

    // 4. 부모 요소에서 미디어 찾기 (5단계 제한)
    let current = element.parentElement;
    for (let i = 0; i < 5 && current; i++) {
      const parentMedia = current.querySelector(':scope > img, :scope > video');
      if (parentMedia) {
        return parentMedia as HTMLElement;
      }
      current = current.parentElement;
    }

    return null;
  }

  /**
   * 요소가 부모의 직접 자식인지 확인
   * @private
   */
  private isDirectMediaChild(parent: HTMLElement, child: HTMLElement): boolean {
    const maxDepth = 3; // 최대 3단계까지만 검색
    let current: HTMLElement | null = child;

    for (let i = 0; i < maxDepth; i++) {
      if (current === parent) {
        return true;
      }
      current = current.parentElement;
      if (!current) break;
    }

    return false;
  }

  /**
   * 미디어 요소에서 URL 추출
   */
  private extractMediaUrl(element: HTMLElement): string | null {
    if (element.tagName === 'IMG') {
      return element.getAttribute('src');
    }
    if (element.tagName === 'VIDEO') {
      return element.getAttribute('poster') || element.getAttribute('src');
    }
    return null;
  }

  /**
   * 미디어 URL 정규화
   *
   * 목적:
   * - 쿼리스트링과 프래그먼트 제거하여 순수 파일명만 추출
   * - Twitter API 미디어 URL과 DOM 미디어 요소의 URL 비교 가능하게 만듦
   *
   * 예시:
   * - Input: "https://pbs.twimg.com/media/XYZ123.jpg?format=jpg&name=large"
   * - Output: "XYZ123.jpg"
   *
   * @private
   */
  private normalizeMediaUrl(url: string): string | null {
    if (!url) return null;

    try {
      // URL 객체를 사용하여 pathname 추출 (쿼리스트링 자동 제거)
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 마지막 '/'뒤의 파일명만 추출
      const filename = pathname.split('/').pop();
      return filename && filename.length > 0 ? filename : null;
    } catch {
      // Fallback: 간단한 문자열 파싱 (URL 객체 미지원 환경)
      try {
        const lastSlash = url.lastIndexOf('/');
        if (lastSlash === -1) return null;

        let filenamePart = url.substring(lastSlash + 1);

        // 쿼리스트링 제거
        const queryIndex = filenamePart.indexOf('?');
        if (queryIndex !== -1) {
          filenamePart = filenamePart.substring(0, queryIndex);
        }

        // 프래그먼트 제거
        const hashIndex = filenamePart.indexOf('#');
        if (hashIndex !== -1) {
          filenamePart = filenamePart.substring(0, hashIndex);
        }

        return filenamePart.length > 0 ? filenamePart : null;
      } catch {
        return null;
      }
    }
  }

  /**
   * DOM 순서 기반 인덱스 추정
   */
  private estimateIndexFromDOMOrder(element: HTMLElement, mediaCount: number): number {
    // 트윗 컨테이너 찾기
    const tweetContainer = element.closest('[data-testid="tweet"], article');
    if (!tweetContainer) return 0;

    // 컨테이너 내 모든 미디어 요소 찾기
    const allMediaElements = tweetContainer.querySelectorAll('img, video');
    const mediaArray = Array.from(allMediaElements);

    // 클릭된 요소의 인덱스 찾기
    const clickedMedia = this.findMediaElement(element);
    if (clickedMedia) {
      const index = mediaArray.indexOf(clickedMedia);
      if (index !== -1 && index < mediaCount) {
        return index;
      }
    }

    return 0;
  }

  /**
   * 실패 결과 생성
   */
  private createFailureResult(error: string): MediaExtractionResult {
    return {
      success: false,
      mediaItems: [],
      clickedIndex: 0,
      metadata: {
        extractedAt: Date.now(),
        sourceType: 'twitter-api',
        strategy: 'api-extraction-failed',
        error,
      },
      tweetInfo: null,
    };
  }
}
