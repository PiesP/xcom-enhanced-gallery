/**
 * BackgroundTweetLoader - GM_xmlhttpRequest 기반 미디어 추출
 *
 * X.com 트윗 페이지를 백그라운드에서 로드하여 정확한 미디어 추출
 * 사용자 ID 추출과 견고한 URL     const loadPromise = this._loadTweetAndExtractMedia(
      tweetId,
      timeout,
      enableFallback,
      onProgress,
      targetMediaIndex
    );통한 안정적인 미디어 로딩
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { URLPatterns } from '@shared/utils/patterns/url-patterns';
import type { GMXmlHttpRequestOptions } from '../../../infrastructure/types/userscript.d.ts';
import { MediaExtractionService } from './MediaExtractionService';

/**
 * 사용자 ID 추출 결과
 */
export interface UserIdExtractionResult {
  /** 추출된 사용자 ID */
  userId?: string;
  /** 추출 방법 */
  extractionMethod?: 'url' | 'dom' | 'meta' | 'link';
  /** 신뢰도 (1-10) */
  confidence?: number;
}

/**
 * 트윗 URL 옵션
 */
export interface TweetUrlOptions {
  /** 사용자 ID */
  userId?: string;
  /** 트윗 ID */
  tweetId: string;
  /** 폴백 URL 패턴 사용 여부 */
  enableFallback?: boolean;
}

/**
 * 트윗 로딩 옵션
 */
export interface TweetLoadOptions {
  /** 타임아웃 (밀리초) */
  timeout?: number | undefined;
  /** 폴백 활성화 여부 */
  enableFallback?: boolean | undefined;
  /** 진행 상황 콜백 */
  onProgress?: ((status: string) => void) | undefined;
  /** 특정 미디어 인덱스 시작 */
  targetMediaIndex?: number | undefined;
}

/**
 * 트윗 로딩 결과
 */
export interface TweetLoadResult {
  /** 성공 여부 */
  success: boolean;
  /** 추출된 미디어 아이템들 */
  mediaItems: MediaInfo[];
  /** 클릭된 미디어 인덱스 */
  clickedIndex: number;
  /** 로딩 시간 (밀리초) */
  loadTime?: number;
  /** 오류 메시지 */
  error?: string;
  /** 원본 트윗 URL */
  originalUrl?: string;
}

/**
 * BackgroundTweetLoader 클래스
 * GM_xmlhttpRequest를 사용한 백그라운드 트윗 로딩
 */
export class BackgroundTweetLoader {
  private static instance: BackgroundTweetLoader;
  private readonly activeRequests = new Map<string, Promise<TweetLoadResult>>();
  private readonly mediaExtractor: MediaExtractionService;

  private constructor() {
    this.mediaExtractor = MediaExtractionService.getInstance();

    logger.info('BackgroundTweetLoader: GM_xmlhttpRequest 기반 로더 초기화');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): BackgroundTweetLoader {
    if (!BackgroundTweetLoader.instance) {
      BackgroundTweetLoader.instance = new BackgroundTweetLoader();
    }
    return BackgroundTweetLoader.instance;
  }

  /**
   * 트윗에서 미디어 로드 (GM_xmlhttpRequest 기반)
   * 미디어 링크가 전달된 경우 트윗 URL로 정규화하여 처리
   */
  public async loadMediaFromTweet(
    tweetIdOrUrl: string,
    options: TweetLoadOptions = {}
  ): Promise<TweetLoadResult> {
    const { timeout = 15000, enableFallback = true, onProgress, targetMediaIndex } = options;

    const startTime = Date.now();

    // URL에서 트윗 ID 추출 (미디어 링크 처리 포함)
    const tweetId = this._extractTweetIdFromUrl(tweetIdOrUrl);
    if (!tweetId || !/^\d+$/.test(tweetId)) {
      logger.error('BackgroundTweetLoader: 유효하지 않은 트윗 ID/URL:', tweetIdOrUrl);
      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        error: '유효하지 않은 트윗 ID 또는 URL',
      };
    }

    // 중복 요청 방지
    const requestKey = `${tweetId}_${targetMediaIndex ?? 'all'}`;
    if (this.activeRequests.has(requestKey)) {
      logger.debug('BackgroundTweetLoader: 기존 요청 재사용', { tweetId, targetMediaIndex });
      return this.activeRequests.get(requestKey) as Promise<TweetLoadResult>;
    }

    const loadPromise = this._loadMediaFromTweetInternal(
      tweetId,
      timeout,
      enableFallback,
      onProgress,
      targetMediaIndex
    );

    this.activeRequests.set(requestKey, loadPromise);

    try {
      const result = await loadPromise;
      result.loadTime = Date.now() - startTime;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  /**
   * 내부 로딩 로직
   */
  private async _loadMediaFromTweetInternal(
    tweetId: string,
    timeout: number,
    enableFallback: boolean,
    onProgress?: (status: string) => void,
    targetMediaIndex?: number
  ): Promise<TweetLoadResult> {
    try {
      onProgress?.('사용자 ID 추출 중...');

      // 1. 트윗 HTML 로드
      const tweetHtml = await this._loadTweetHtml(tweetId, timeout);

      onProgress?.('HTML 파싱 중...');

      // 2. 가상 DOM 생성 및 파싱
      const tweetContainer = this._parseHtmlToContainer(tweetHtml, tweetId);

      if (!tweetContainer) {
        throw new Error('트윗 컨테이너를 찾을 수 없음');
      }

      onProgress?.('미디어 추출 중...');

      // 3. 미디어 추출
      const extractionResult = await this.mediaExtractor.extractAllFromContainer(tweetContainer);

      if (extractionResult.success && extractionResult.mediaItems.length > 0) {
        logger.info('BackgroundTweetLoader: 미디어 추출 성공', {
          tweetId,
          mediaCount: extractionResult.mediaItems.length,
          targetIndex: targetMediaIndex,
        });

        // 4. 클릭된 미디어 인덱스 조정
        const clickedIndex =
          targetMediaIndex !== undefined && targetMediaIndex < extractionResult.mediaItems.length
            ? targetMediaIndex
            : (extractionResult.clickedIndex ?? 0);

        onProgress?.('미디어 추출 완료');

        return {
          success: true,
          mediaItems: [...extractionResult.mediaItems],
          clickedIndex,
          originalUrl: `https://x.com/i/status/${tweetId}`,
        };
      }

      // 5. 폴백 처리
      if (enableFallback) {
        onProgress?.('폴백 미디어 생성 중...');
        const fallbackMedia = this._createBasicFallbackMedia(tweetId, targetMediaIndex);

        return {
          success: false,
          mediaItems: fallbackMedia,
          clickedIndex: targetMediaIndex ?? 0,
          error: '미디어를 찾을 수 없어 폴백 사용',
          originalUrl: `https://x.com/i/status/${tweetId}`,
        };
      }

      return {
        success: false,
        mediaItems: [],
        clickedIndex: 0,
        error: '미디어를 찾을 수 없음',
      };
    } catch (error) {
      logger.error('BackgroundTweetLoader: 로딩 실패', { tweetId, error });

      return {
        success: false,
        mediaItems: enableFallback ? this._createBasicFallbackMedia(tweetId, targetMediaIndex) : [],
        clickedIndex: targetMediaIndex ?? 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * GM_xmlhttpRequest로 트윗 HTML 로드
   * 미디어 링크에서 트윗 URL을 정규화하여 처리
   */
  private async _loadTweetHtml(tweetIdOrUrl: string, timeout: number): Promise<string> {
    // 트윗 ID 추출 및 정규화
    const tweetId = this._extractTweetIdFromUrl(tweetIdOrUrl);
    if (!tweetId || !/^\d+$/.test(tweetId)) {
      throw new Error(`유효하지 않은 트윗 ID: ${tweetIdOrUrl}`);
    }

    return new Promise((resolve, reject) => {
      // 일관된 트윗 URL 전략: 백그라운드 로딩에는 일반 트윗 URL 사용
      const tweetUrl = `https://x.com/i/status/${tweetId}`;
      logger.debug('BackgroundTweetLoader: 트윗 URL 생성:', {
        originalInput: tweetIdOrUrl,
        tweetId,
        tweetUrl,
      });

      // GM_xmlhttpRequest 옵션
      const requestOptions: GMXmlHttpRequestOptions = {
        method: 'GET',
        url: tweetUrl,
        timeout,
        responseType: 'text',
        headers: {
          'User-Agent': navigator.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        onload: response => {
          if (response.status >= 200 && response.status < 300) {
            logger.debug('BackgroundTweetLoader: HTML 로드 성공', {
              tweetId,
              status: response.status,
              size: response.responseText?.length,
            });
            resolve(response.responseText ?? '');
          } else {
            logger.error('BackgroundTweetLoader: HTTP 에러', {
              tweetId,
              status: response.status,
              statusText: response.statusText,
            });
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror: response => {
          logger.error('BackgroundTweetLoader: 네트워크 에러', { tweetId, response });
          reject(new Error('네트워크 요청 실패'));
        },
        ontimeout: () => {
          logger.error('BackgroundTweetLoader: 타임아웃', { tweetId, timeout });
          reject(new Error(`요청 타임아웃 (${timeout}ms)`));
        },
      };

      // GM_xmlhttpRequest 실행
      if (typeof GM_xmlhttpRequest !== 'undefined') {
        // eslint-disable-next-line no-undef
        GM_xmlhttpRequest(requestOptions);
      } else {
        reject(new Error('GM_xmlhttpRequest를 사용할 수 없음'));
      }
    });
  }

  /**
   * HTML을 파싱하여 트윗 컨테이너 생성
   */
  private _parseHtmlToContainer(html: string, tweetId: string): HTMLElement | null {
    try {
      // DOMParser를 사용하여 HTML 파싱
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      logger.debug('BackgroundTweetLoader: HTML 파싱 완료', {
        tweetId,
        htmlLength: html.length,
        hasBody: !!doc.body,
        bodyChildrenCount: doc.body?.children.length ?? 0,
      });

      // 트윗 컨테이너 찾기 - 여러 선택자 시도 (확장된 버전)
      const selectors = [
        // 기본 트윗 선택자들
        `[data-testid="tweet"]`,
        `article[role="article"]`,
        `article[data-testid="tweet"]`,
        `article`,

        // 트윗 ID 기반 선택자들
        `[data-tweet-id="${tweetId}"]`,
        `[href*="/status/${tweetId}"]`,

        // 클래스 및 데이터 속성 기반
        `.tweet`,
        `div[data-testid="cellInnerDiv"]`,
        `div[data-testid="tweetDetail"]`,
        `div[data-testid="primaryColumn"]`,

        // 레이아웃 및 구조 기반
        `main[role="main"] section`,
        `main section article`,
        `[role="main"] [role="article"]`,

        // 접근성 레이블 기반
        `div[aria-label*="Tweet"]`,
        `div[aria-label*="tweet"]`,
        `[aria-label*="Conversation"]`,

        // 상태 및 통계 기반
        `[data-tweet-stat]`,
        `div:has(a[href*="/status/"])`,

        // 미디어 관련 컨테이너
        `div:has([data-testid="tweetPhoto"])`,
        `div:has([data-testid="videoPlayer"])`,
        `div:has([data-testid="videoComponent"])`,

        // 폴백 선택자들 (더 넓은 범위)
        `div[data-testid] article`,
        `section div[role]`,
        `main div[data-testid]`,

        // 최후 폴백: 미디어나 텍스트 콘텐츠가 있는 요소
        `div:has(img[src*="twimg"])`,
        `div:has(video)`,
        `div:has([data-testid="tweetText"])`,
      ];

      // 전체 선택자 진단 정보 수집
      const diagnosticInfo = {
        totalElements: doc.querySelectorAll('*').length,
        articles: doc.querySelectorAll('article').length,
        divs: doc.querySelectorAll('div').length,
        hasDataTestId: doc.querySelectorAll('[data-testid]').length,
        hasTweetTestId: doc.querySelectorAll('[data-testid="tweet"]').length,
        hasStatusLinks: doc.querySelectorAll(`a[href*="/status/"]`).length,
        hasSpecificStatusLink: doc.querySelectorAll(`a[href*="/status/${tweetId}"]`).length,
        hasImages: doc.querySelectorAll('img').length,
        hasVideos: doc.querySelectorAll('video').length,
        hasMain: !!doc.querySelector('main'),
        hasReactRoot: !!doc.querySelector('#react-root'),
      };

      logger.debug('BackgroundTweetLoader: DOM 구조 진단', {
        tweetId,
        ...diagnosticInfo,
      });

      for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        logger.debug(
          `BackgroundTweetLoader: 선택자 "${selector}"로 ${elements.length}개 요소 발견`
        );

        for (const element of elements) {
          // 트윗 ID 확인 - 더 유연한 매칭
          const linkElement = element.querySelector(`a[href*="/status/${tweetId}"]`);
          const hasDataTweetId = element.getAttribute('data-tweet-id') === tweetId;

          // 추가 검증: 하위 요소에서 트윗 링크 존재 여부 확인
          const hasStatusLink = !!linkElement;
          const hasMediaContent = element.querySelector('img, video, [data-testid="tweetPhoto"]');

          // 다른 트윗 ID 링크도 확인 (일반적인 상태 링크)
          const anyStatusLink = element.querySelector('a[href*="/status/"]');
          const hasAnyStatusLink = !!anyStatusLink;
          const hasRelevantContent = element.querySelector(
            '[data-testid="tweetText"], [data-testid="tweetPhoto"], [data-testid="videoPlayer"]'
          );

          // 조건 확인 로그
          logger.debug(`BackgroundTweetLoader: 요소 검사 (${selector})`, {
            tweetId,
            tagName: element.tagName,
            className: (element as HTMLElement).className,
            hasDataTweetId,
            hasStatusLink,
            hasAnyStatusLink,
            hasMediaContent: !!hasMediaContent,
            hasRelevantContent: !!hasRelevantContent,
            textContent: element.textContent?.substring(0, 100),
          });

          if (
            hasDataTweetId ||
            hasStatusLink ||
            (hasMediaContent && selector.includes('article')) ||
            (hasRelevantContent && hasAnyStatusLink)
          ) {
            logger.debug('BackgroundTweetLoader: 트윗 컨테이너 발견', {
              tweetId,
              selector,
              tagName: element.tagName,
              hasDataTweetId,
              hasStatusLink,
              hasMediaContent: !!hasMediaContent,
              hasRelevantContent: !!hasRelevantContent,
            });
            return element as HTMLElement;
          }
        }
      }

      // 폴백 1: 첫 번째 article 요소 사용
      const firstArticle = doc.querySelector('article');
      if (firstArticle) {
        logger.warn('BackgroundTweetLoader: 폴백으로 첫 번째 article 사용', { tweetId });
        return firstArticle as HTMLElement;
      }

      // 폴백 2: main 역할을 하는 요소 찾기
      const mainElement = doc.querySelector('main, [role="main"], #react-root main');
      if (mainElement) {
        logger.warn('BackgroundTweetLoader: 폴백으로 main 요소 사용', { tweetId });
        return mainElement as HTMLElement;
      }

      // 폴백 3: body 전체 사용 (최후의 수단)
      if (doc.body && doc.body.children.length > 0) {
        logger.warn('BackgroundTweetLoader: 폴백으로 body 요소 사용', { tweetId });
        return doc.body as HTMLElement;
      }

      logger.warn('BackgroundTweetLoader: 트윗 컨테이너를 찾을 수 없음', {
        tweetId,
        htmlPreview: html.substring(0, 500),
        availableSelectors: selectors.map(sel => ({
          selector: sel,
          count: doc.querySelectorAll(sel).length,
        })),
      });
      return null;
    } catch (error) {
      logger.error('BackgroundTweetLoader: HTML 파싱 실패', {
        tweetId,
        error: error instanceof Error ? error.message : 'Unknown error',
        htmlLength: html.length,
        htmlHasContent: html.trim().length > 0,
      });
      return null;
    }
  }

  /**
   * 기본 폴백 미디어 생성
   */
  private _createBasicFallbackMedia(tweetId: string, targetIndex?: number): MediaInfo[] {
    const baseMediaInfo: MediaInfo = {
      id: `${tweetId}_fallback_0`,
      url: `https://x.com/i/status/${tweetId}`,
      type: 'image',
      filename: '',
      tweetUsername: '',
      tweetId,
      tweetUrl: `https://x.com/i/status/${tweetId}`,
      originalUrl: `https://x.com/i/status/${tweetId}`,
      thumbnailUrl: '',
      alt: 'Fallback media',
      metadata: {
        isFallback: true,
        targetIndex,
      },
    };

    return [baseMediaInfo];
  }

  /**
   * URL에서 트윗 ID 추출 (미디어 링크 포함)
   *
   * @private
   */
  private _extractTweetIdFromUrl(urlOrId: string): string {
    try {
      // 이미 트윗 ID인 경우 (숫자만)
      if (/^\d+$/.test(urlOrId)) {
        return urlOrId;
      }

      // 미디어 링크인 경우 트윗 URL로 변환 후 ID 추출
      if (urlOrId.includes('/photo/') || urlOrId.includes('/video/')) {
        const tweetUrl = URLPatterns.extractTweetUrlFromMediaLink(urlOrId);
        if (tweetUrl) {
          const match = tweetUrl.match(/\/status\/(\d+)/);
          return match?.[1] ?? '';
        }
      }

      // 일반 트윗 URL에서 ID 추출
      const match = urlOrId.match(/\/status\/(\d+)/);
      return match?.[1] ?? '';
    } catch (error) {
      logger.error('BackgroundTweetLoader: 트윗 ID 추출 실패:', error);
      return '';
    }
  }

  /**
   * 활성 요청 수 반환
   */
  public getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * 특정 요청 취소
   */
  public cancelRequest(tweetId: string): void {
    if (this.activeRequests.has(tweetId)) {
      this.activeRequests.delete(tweetId);
      logger.info(`BackgroundTweetLoader: 요청 취소됨 - ${tweetId}`);
    }
  }

  /**
   * 모든 활성 요청 취소
   */
  public cancelAllRequests(): void {
    this.activeRequests.clear();
    logger.info('BackgroundTweetLoader: 모든 활성 요청 취소됨');
  }

  /**
   * 리소스 정리
   */
  public cleanup(): void {
    this.cancelAllRequests();
    logger.info('BackgroundTweetLoader: 리소스 정리 완료');
  }
}

// 기본 export
export default BackgroundTweetLoader;
