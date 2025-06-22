/**
 * Hidden Tweet Loader Service
 *
 * @fileoverview 미디어 페이지에서 트윗 페이지를 GM_xmlhttpRequest로 로드하여 미디어를 추출하는 서비스
 * @version 2.0.0
 * @author X.com Enhanced Gallery Team
 */

import type { MediaInfo } from '@core/types/media.types';
import { logger } from '@infrastructure/logging/logger';
import { URLPatterns } from '@shared/utils/patterns/url-patterns';
import type { GMXmlHttpRequestOptions } from '../../../infrastructure/types/userscript.d.ts';

export interface HiddenTweetLoadOptions {
  /** 타임아웃 (밀리초) */
  timeout?: number;
  /** 캐싱 활성화 */
  enableCache?: boolean;
  /** 미디어 완전 로딩 대기 (더 이상 사용하지 않음, GM_xmlhttpRequest 사용) */
  waitForMedia?: boolean;
}

export interface HiddenTweetLoadResult {
  /** 성공 여부 */
  success: boolean;
  /** 추출된 미디어 아이템들 */
  mediaItems: MediaInfo[];
  /** 트윗 ID */
  tweetId: string;
  /** 에러 메시지 */
  error?: string;
  /** 로딩 시간 (밀리초) */
  loadTime?: number;
}

/**
 * 트윗 페이지를 GM_xmlhttpRequest로 로드하여 미디어를 추출하는 서비스
 */
export class HiddenTweetLoaderService {
  private static instance: HiddenTweetLoaderService;
  private readonly loadingCache = new Map<string, Promise<HiddenTweetLoadResult>>();

  private constructor() {
    logger.debug('HiddenTweetLoaderService: GM_xmlhttpRequest 기반 인스턴스 생성');
  }

  static getInstance(): HiddenTweetLoaderService {
    if (!this.instance) {
      this.instance = new HiddenTweetLoaderService();
    }
    return this.instance;
  }

  /**
   * 트윗 ID로부터 미디어를 추출
   * 미디어 링크가 전달된 경우 트윗 URL로 정규화하여 처리
   *
   * @param tweetIdOrUrl - 트윗 ID 또는 미디어 링크
   * @param options - 로드 옵션
   * @returns 미디어 추출 결과
   */
  async extractMediaFromTweet(
    tweetIdOrUrl: string,
    options: HiddenTweetLoadOptions = {}
  ): Promise<HiddenTweetLoadResult> {
    const { timeout = 10000, enableCache = true, waitForMedia = true } = options;

    // URL에서 트윗 ID 추출 (미디어 링크 처리 포함)
    const tweetId = this.extractTweetIdFromUrl(tweetIdOrUrl);
    if (!tweetId || tweetId === 'unknown') {
      logger.error('HiddenTweetLoaderService: 유효하지 않은 트윗 ID/URL:', tweetIdOrUrl);
      return {
        success: false,
        mediaItems: [],
        tweetId: 'unknown',
        error: '유효하지 않은 트윗 ID 또는 URL',
      };
    }

    // 캐시 확인
    if (enableCache && this.loadingCache.has(tweetId)) {
      logger.debug('HiddenTweetLoaderService: 캐시된 로딩 프로세스 재사용:', tweetId);
      const cachedPromise = this.loadingCache.get(tweetId);
      if (cachedPromise) {
        return cachedPromise;
      }
    }

    const loadPromise = this._loadTweetAndExtractMedia(tweetId, timeout, waitForMedia);

    if (enableCache) {
      this.loadingCache.set(tweetId, loadPromise);

      // 완료 후 캐시에서 제거 (성공/실패 무관)
      loadPromise.finally(() => {
        this.loadingCache.delete(tweetId);
      });
    }

    return loadPromise;
  }

  /**
   * 실제 트윗 로드 및 미디어 추출 로직 (개선된 폴백 전략)
   * GM_xmlhttpRequest 기반으로 구현
   *
   * @description 다중 URL 전략으로 로그인 정보 부재 시에도 트윗 로딩 시도
   * @private
   */
  private async _loadTweetAndExtractMedia(
    tweetId: string,
    timeout: number,
    _waitForMedia: boolean // 더 이상 사용하지 않음
  ): Promise<HiddenTweetLoadResult> {
    const startTime = Date.now();

    try {
      logger.info('HiddenTweetLoaderService: 트윗 로드 시작 (GM_xmlhttpRequest):', tweetId);

      // ✅ 다중 URL 전략으로 트윗 HTML 로드
      const tweetHtml = await this._loadTweetWithFallback(tweetId, timeout);

      // HTML을 파싱하여 미디어 추출
      const mediaItems = await this._extractMediaFromHtml(tweetHtml, tweetId);

      const loadTime = Date.now() - startTime;

      logger.info('HiddenTweetLoaderService: 트윗 로드 완료:', {
        tweetId,
        mediaCount: mediaItems.length,
        loadTime,
      });

      return {
        success: true,
        mediaItems,
        tweetId,
        loadTime,
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('HiddenTweetLoaderService: 트윗 로드 실패:', {
        tweetId,
        error: errorMessage,
        loadTime,
      });

      return {
        success: false,
        mediaItems: [],
        tweetId,
        error: errorMessage,
        loadTime,
      };
    }
  }

  /**
   * 대안 전략으로 트윗 로딩 시도 (다중 URL 전략)
   *
   * @description 표준 URL 실패 시 대안 URL들을 순차적으로 시도
   * @private
   */
  private async _loadTweetWithFallback(tweetId: string, timeout: number): Promise<string> {
    const strategies = [
      // 1차 시도: 표준 트윗 URL
      `https://x.com/i/web/status/${tweetId}`,
      // 2차 시도: 직접 상태 URL
      `https://x.com/i/status/${tweetId}`,
      // 3차 시도: 모바일 URL
      `https://mobile.x.com/i/web/status/${tweetId}`,
      // 4차 시도: 사용자명 포함 URL (현재 페이지에서 추출)
      this._buildUserSpecificUrl(tweetId),
    ].filter(Boolean) as string[];

    let lastError: Error | null = null;

    for (let i = 0; i < strategies.length; i++) {
      const url = strategies[i];
      if (!url) continue; // undefined URL 체크

      try {
        logger.debug(`HiddenTweetLoaderService: URL 전략 ${i + 1}/${strategies.length} 시도:`, url);
        const result = await this._loadTweetHtml(url, timeout);

        // 성공 시 결과가 유효한지 확인
        if (result && result.length > 0) {
          logger.info(`HiddenTweetLoaderService: URL 전략 ${i + 1} 성공:`, url);
          return result;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn(`HiddenTweetLoaderService: URL 전략 ${i + 1} 실패:`, {
          url,
          error: lastError.message,
        });

        // 마지막 전략이 아니면 다음 전략 시도
        if (i < strategies.length - 1) {
          continue;
        }
      }
    }

    // 모든 전략 실패
    throw lastError ?? new Error('All URL strategies failed');
  }

  /**
   * 현재 페이지에서 사용자명을 추출하여 사용자별 URL 생성
   *
   * @description 현재 페이지의 URL이나 DOM에서 사용자명을 추출
   * @private
   */
  private _buildUserSpecificUrl(tweetId: string): string | null {
    try {
      // URL에서 사용자명 추출
      const urlMatch = window.location.pathname.match(/^\/([^/]+)/);
      if (urlMatch && urlMatch[1] !== 'i' && urlMatch[1] !== 'home') {
        const username = urlMatch[1];
        logger.debug('HiddenTweetLoaderService: URL에서 사용자명 추출:', username);
        return `https://x.com/${username}/status/${tweetId}`;
      }

      // DOM에서 사용자명 추출
      const userLinks = document.querySelectorAll('a[href^="/"][href*="/status/"]');
      for (const link of userLinks) {
        const href = (link as HTMLAnchorElement).href;
        const match = href.match(/x\.com\/([^/]+)\/status\//);
        if (match && match[1] !== 'i') {
          const username = match[1];
          logger.debug('HiddenTweetLoaderService: DOM에서 사용자명 추출:', username);
          return `https://x.com/${username}/status/${tweetId}`;
        }
      }

      return null;
    } catch (error) {
      logger.debug('HiddenTweetLoaderService: 사용자명 추출 실패:', error);
      return null;
    }
  }

  /**
   * GM_xmlhttpRequest로 트윗 HTML 로드 (개선된 인증 포함)
   *
   * @description 현재 페이지의 쿠키와 인증 정보를 포함하여 요청
   * @private
   */
  private async _loadTweetHtml(tweetUrl: string, timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      // ✅ 현재 페이지의 쿠키를 포함한 요청 옵션
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
          // ✅ 현재 페이지의 쿠키 전달
          Cookie: document.cookie,
          // ✅ Referer 헤더 추가
          Referer: window.location.href,
          // ✅ X-Requested-With 헤더 추가
          'X-Requested-With': 'XMLHttpRequest',
          // ✅ 추가 X.com 인증 헤더들
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'upgrade-insecure-requests': '1',
        },
        onload: response => {
          if (response.status >= 200 && response.status < 300) {
            logger.debug('HiddenTweetLoaderService: HTML 로드 성공', {
              url: tweetUrl,
              status: response.status,
              size: response.responseText?.length,
              // ✅ 응답 헤더 로깅
              contentType: response.responseHeaders?.match(/content-type:\s*([^\r\n]+)/i)?.[1],
            });
            resolve(response.responseText ?? '');
          } else {
            logger.error('HiddenTweetLoaderService: HTTP 에러', {
              url: tweetUrl,
              status: response.status,
              statusText: response.statusText,
              // ✅ 상세 에러 정보
              responseHeaders: response.responseHeaders,
            });
            reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
          }
        },
        onerror: response => {
          logger.error('HiddenTweetLoaderService: 네트워크 에러', { url: tweetUrl, response });
          reject(new Error('네트워크 요청 실패'));
        },
        ontimeout: () => {
          logger.error('HiddenTweetLoaderService: 타임아웃', { url: tweetUrl, timeout });
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
   * HTML을 파싱하여 미디어 추출 (개선된 검증 포함)
   *
   * @description 강화된 접근 거부 감지를 사용하여 더 정확한 오류 처리
   * @private
   */
  private async _extractMediaFromHtml(html: string, tweetId: string): Promise<MediaInfo[]> {
    try {
      // ✅ 강화된 접근 거부 감지 시스템 사용
      const accessCheck = this._detectAccessDenied(html);
      if (accessCheck.isAccessDenied) {
        logger.warn('HiddenTweetLoaderService: 접근 거부 감지:', {
          reason: accessCheck.reason,
          indicators: accessCheck.indicators,
          tweetId,
        });

        // 사용자에게 알림
        this._notifyAccessDenied(tweetId, accessCheck.reason, accessCheck.indicators);
        return [];
      }

      // DOMParser를 사용하여 HTML 파싱
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 트윗 컨테이너 찾기
      const tweetContainer = this._findTweetContainer(doc, tweetId);

      if (!tweetContainer) {
        logger.warn('HiddenTweetLoaderService: 트윗 컨테이너를 찾을 수 없음', { tweetId });
        // 전체 문서에서 미디어 추출 시도
        return this._extractMediaFromDocument(doc, tweetId);
      }

      // 트윗 컨테이너에서 미디어 추출
      return this._extractMediaFromElement(tweetContainer as HTMLElement, tweetId);
    } catch (error) {
      logger.error('HiddenTweetLoaderService: HTML 파싱 실패:', error);
      throw error;
    }
  }

  /**
   * 문서에서 트윗 컨테이너 찾기
   *
   * @private
   */
  private _findTweetContainer(doc: Document, tweetId: string): Element | null {
    // 트윗 컨테이너 찾기 - 여러 선택자 시도
    const selectors = [
      `[data-testid="tweet"]`,
      `article[role="article"]`,
      `[data-tweet-id="${tweetId}"]`,
      `.tweet`,
      `[href*="/status/${tweetId}"]`,
    ];

    for (const selector of selectors) {
      const elements = doc.querySelectorAll(selector);

      for (const element of elements) {
        // 트윗 ID 확인
        const linkElement = element.querySelector(`a[href*="/status/${tweetId}"]`);
        if (linkElement || element.getAttribute('data-tweet-id') === tweetId) {
          logger.debug('HiddenTweetLoaderService: 트윗 컨테이너 발견', {
            tweetId,
            selector,
            tagName: element.tagName,
          });
          return element;
        }
      }
    }

    // 폴백: 첫 번째 article 요소 사용
    const firstArticle = doc.querySelector('article');
    if (firstArticle) {
      logger.warn('HiddenTweetLoaderService: 폴백으로 첫 번째 article 사용', { tweetId });
      return firstArticle;
    }

    return null;
  }

  /**
   * Element에서 미디어 추출 (개선된 버전)
   *
   * @private
   */
  private _extractMediaFromElement(element: HTMLElement, tweetId: string): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];
    let mediaIndex = 0;

    // 이미지 추출 (더 포괄적인 선택자 사용)
    const imageSelectors = [
      'img[src*="pbs.twimg.com/media/"]',
      '[data-testid="tweetPhoto"] img[src*="pbs.twimg.com/media/"]',
    ];

    for (const selector of imageSelectors) {
      const images = element.querySelectorAll(selector);
      images.forEach(img => {
        const imgElement = img as HTMLImageElement;
        if (imgElement.src?.includes('pbs.twimg.com/media/')) {
          const originalUrl = `${
            imgElement.src.replace(/[?&](format|name)=[^&]*/g, '').split('?')[0]
          }?format=jpg&name=orig`;

          mediaItems.push({
            id: `img_${mediaIndex++}`,
            type: 'image',
            url: originalUrl,
            thumbnailUrl: imgElement.src,
            tweetId,
            filename: '',
            tweetUsername: '',
            tweetUrl: `https://x.com/i/status/${tweetId}`,
            originalUrl,
            alt: `Image ${mediaItems.length + 1}`,
          });
        }
      });
    }

    // 비디오 추출 (더 포괄적인 선택자 사용)
    const videoSelectors = [
      'video[src], video source[src]',
      '[data-testid="videoPlayer"] video[src], [data-testid="videoPlayer"] video source[src]',
    ];

    for (const selector of videoSelectors) {
      const videos = element.querySelectorAll(selector);
      videos.forEach(video => {
        const videoElement = video as HTMLVideoElement | HTMLSourceElement;
        const src = videoElement.src || videoElement.getAttribute('src');
        if (src) {
          mediaItems.push({
            id: `video_${mediaIndex++}`,
            type: 'video',
            url: src,
            thumbnailUrl: src,
            tweetId,
            filename: '',
            tweetUsername: '',
            tweetUrl: `https://x.com/i/status/${tweetId}`,
            originalUrl: src,
            alt: `Video ${mediaItems.length + 1}`,
          });
        }
      });
    }

    logger.debug('HiddenTweetLoaderService: Element에서 미디어 추출 완료:', {
      tweetId,
      totalItems: mediaItems.length,
    });

    return mediaItems;
  }

  /**
   * 전체 Document에서 미디어 추출 (폴백)
   *
   * @private
   */
  private _extractMediaFromDocument(doc: Document, tweetId: string): MediaInfo[] {
    // 1. 먼저 트윗 ID로 특정 콘텐츠 찾기 시도
    const specificSelectors = [
      `[data-tweet-id="${tweetId}"]`,
      `a[href*="/status/${tweetId}"]`,
      `article[data-testid="tweet"]:has(a[href*="/status/${tweetId}"])`,
    ];

    for (const selector of specificSelectors) {
      try {
        const container = doc.querySelector(selector);
        if (container) {
          logger.debug('HiddenTweetLoaderService: 트윗별 컨테이너 발견:', { selector, tweetId });
          return this._extractMediaFromElement(container as HTMLElement, tweetId);
        }
      } catch {
        // CSS 선택자 오류 무시
        continue;
      }
    }

    // 2. 폴백: 더 엄격한 필터링으로 일반 추출
    logger.warn('HiddenTweetLoaderService: 트윗별 미디어 찾기 실패, 일반 추출 시도', { tweetId });
    return this._extractGenericMedia(doc, tweetId);
  }

  /**
   * 일반적인 미디어 추출 (검증 포함)
   *
   * @private
   */
  private _extractGenericMedia(doc: Document, tweetId: string): MediaInfo[] {
    const mediaItems: MediaInfo[] = [];
    let mediaIndex = 0;

    // 이미지 추출
    const images = doc.querySelectorAll('img[src*="pbs.twimg.com/media/"]');
    images.forEach(img => {
      const imgElement = img as HTMLImageElement;

      // 중요: 트윗 ID 검증 추가
      const nearestArticle = imgElement.closest('article');
      const associatedTweetLink = nearestArticle?.querySelector(`a[href*="/status/${tweetId}"]`);

      if (!associatedTweetLink) {
        logger.debug('이미지가 대상 트윗과 연관되지 않음', {
          tweetId,
          imgSrc: imgElement.src.substring(0, 100),
        });
        return; // 건너뛰기
      }

      if (imgElement.src?.includes('pbs.twimg.com/media/')) {
        const originalUrl = `${
          imgElement.src.replace(/[?&](format|name)=[^&]*/g, '').split('?')[0]
        }?format=jpg&name=orig`;

        mediaItems.push({
          id: `img_${mediaIndex++}`,
          type: 'image',
          url: originalUrl,
          thumbnailUrl: imgElement.src,
          tweetId,
          filename: '',
          tweetUsername: '',
          tweetUrl: `https://x.com/i/status/${tweetId}`,
          originalUrl,
          alt: `Image ${mediaItems.length + 1}`,
        });
      }
    });

    // 비디오 추출 (동일한 검증 적용)
    const videos = doc.querySelectorAll('video[src], video source[src]');
    videos.forEach(video => {
      const videoElement = video as HTMLVideoElement | HTMLSourceElement;

      // 트윗 ID 검증
      const nearestArticle = videoElement.closest('article');
      const associatedTweetLink = nearestArticle?.querySelector(`a[href*="/status/${tweetId}"]`);

      if (!associatedTweetLink) {
        logger.debug('비디오가 대상 트윗과 연관되지 않음', { tweetId });
        return; // 건너뛰기
      }

      const src = videoElement.src || videoElement.getAttribute('src');
      if (src) {
        mediaItems.push({
          id: `video_${mediaIndex++}`,
          type: 'video',
          url: src,
          thumbnailUrl: src,
          tweetId,
          filename: '',
          tweetUsername: '',
          tweetUrl: `https://x.com/i/status/${tweetId}`,
          originalUrl: src,
          alt: `Video ${mediaItems.length + 1}`,
        });
      }
    });

    logger.debug('HiddenTweetLoaderService: 검증된 일반 미디어 추출 완료:', {
      tweetId,
      imageCount: images.length,
      videoCount: videos.length,
      validatedItems: mediaItems.length,
    });

    return mediaItems;
  }

  /**
   * URL에서 트윗 ID 추출 (미디어 링크 포함)
   *
   * @private
   */
  private extractTweetIdFromUrl(urlOrId: string): string {
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
          return match?.[1] ?? 'unknown';
        }
      }

      // 일반 트윗 URL에서 ID 추출
      const match = urlOrId.match(/\/status\/(\d+)/);
      return match?.[1] ?? 'unknown';
    } catch (error) {
      logger.error('HiddenTweetLoaderService: 트윗 ID 추출 실패:', error);
      return 'unknown';
    }
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    // 모든 진행 중인 로딩 취소
    this.loadingCache.clear();

    logger.debug('HiddenTweetLoaderService: 정리 완료');
  }

  /**
   * ✅ 강화된 접근 거부/로그인 요구 감지
   */
  private _detectAccessDenied(html: string): {
    isAccessDenied: boolean;
    reason: 'login' | 'private' | 'suspended' | 'rate_limit' | 'blocked' | 'unknown';
    indicators: string[];
  } {
    if (!html || html.length < 100) {
      return {
        isAccessDenied: true,
        reason: 'unknown',
        indicators: ['HTML too short'],
      };
    }

    const lowerHtml = html.toLowerCase();
    const foundIndicators: string[] = [];

    // 로그인 요구 감지
    const loginIndicators = [
      'sign in to x',
      'log in to x',
      'login-required',
      'auth-required',
      '로그인',
      'create account',
      'join x today',
    ];

    // 계정 제재/정지 감지
    const suspendedIndicators = [
      'account suspended',
      'account has been suspended',
      'this account is temporarily unavailable',
      '계정이 정지',
      'suspended account',
    ];

    // 비공개 계정 감지
    const privateIndicators = [
      'these tweets are protected',
      'this account is private',
      'protected tweets',
      '비공개 트윗',
      'follow to see',
    ];

    // 요청 제한 감지
    const rateLimitIndicators = [
      'rate limit exceeded',
      'too many requests',
      'temporarily unavailable',
      '요청이 너무 많습니다',
      'retry after',
    ];

    // 차단/접근 거부 감지
    const blockedIndicators = [
      'this tweet is unavailable',
      "hmm...this page doesn't exist",
      "sorry, that page doesn't exist",
      'tweet not found',
      'user not found',
      '존재하지 않는 페이지',
    ];

    // 각 카테고리별 검사
    const checkIndicators = (indicators: string[], reason: string): string | null => {
      for (const indicator of indicators) {
        if (lowerHtml.includes(indicator)) {
          foundIndicators.push(indicator);
          return reason;
        }
      }
      return null;
    };

    const detectedReason =
      checkIndicators(loginIndicators, 'login') ??
      checkIndicators(suspendedIndicators, 'suspended') ??
      checkIndicators(privateIndicators, 'private') ??
      checkIndicators(rateLimitIndicators, 'rate_limit') ??
      checkIndicators(blockedIndicators, 'blocked');

    // DOM 구조 분석
    const tweetElementCount = (html.match(/data-testid="tweet"/g) ?? []).length;
    const articleElementCount = (html.match(/<article/g) ?? []).length;
    const hasMainContent = html.includes('role="main"');
    const hasNavigation = html.includes('role="navigation"');

    type AccessDeniedReason = 'login' | 'private' | 'suspended' | 'rate_limit' | 'blocked';

    // 정상적인 트위터 페이지 구조가 없는 경우
    if (
      tweetElementCount === 0 &&
      articleElementCount === 0 &&
      (!hasMainContent || !hasNavigation)
    ) {
      foundIndicators.push('Missing Twitter page structure');
      return {
        isAccessDenied: true,
        reason: (detectedReason as AccessDeniedReason) ?? 'unknown',
        indicators: foundIndicators,
      };
    }

    return {
      isAccessDenied: detectedReason !== null || foundIndicators.length > 0,
      reason: (detectedReason as AccessDeniedReason) ?? 'unknown',
      indicators: foundIndicators,
    };
  }

  /**
   * ✅ 접근 거부 알림
   *
   * @description 사용자에게 접근 거부 이유를 알림
   * @private
   */
  private _notifyAccessDenied(tweetId: string, reason: string, indicators: string[]): void {
    const messages = {
      login: '트윗을 보려면 X.com에 로그인해야 합니다',
      private: '이 계정의 트윗은 비공개입니다',
      suspended: '이 계정은 정지되었습니다',
      rate_limit: '요청 제한에 걸렸습니다. 잠시 후 다시 시도해주세요',
      blocked: '이 트윗은 삭제되었거나 접근할 수 없습니다',
      unknown: '트윗에 접근할 수 없습니다',
    };

    const message = messages[reason as keyof typeof messages] ?? messages.unknown;

    logger.warn(`HiddenTweetLoaderService: ${message}`, {
      tweetId,
      reason,
      indicators,
    });

    // GM_notification 사용 (가능한 경우)
    try {
      const gmGlobal = globalThis as {
        GM_notification?: (options: { text: string; title: string; timeout: number }) => void;
      };

      if (typeof gmGlobal.GM_notification !== 'undefined') {
        gmGlobal.GM_notification({
          text: message,
          title: 'X.com Enhanced Gallery',
          timeout: 5000,
        });
      }
    } catch (error) {
      logger.debug('알림 표시 실패:', error);
    }
  }
}
