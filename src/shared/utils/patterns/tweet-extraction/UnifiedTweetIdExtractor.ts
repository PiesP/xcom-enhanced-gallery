/**
 * @fileoverview 통합된 트윗 ID 추출기
 * @description DOM 구조를 기반으로 한 안정적인 트윗 ID 추출 구현
 * @version 2.0.0 - Unified Architecture
 */

import { logger } from '../../../../infrastructure/logging/logger';

export interface TweetExtractionResult {
  tweetId: string;
  username?: string;
  tweetUrl: string;
  extractionMethod: string;
  confidence: number; // 1-10, 추출 신뢰도
}

/**
 * 통합된 트윗 ID 추출기
 * 클릭된 요소를 기준으로 DOM 트리를 거슬러 올라가 트윗 컨테이너를 찾고,
 * 해당 컨테이너 내에서 안정적으로 트윗 ID를 추출합니다.
 */
export class UnifiedTweetIdExtractor {
  private static readonly TWEET_CONTAINER_SELECTORS = [
    'article[data-testid="tweet"]',
    'article[role="article"]',
    '[data-testid="tweet"]',
    '.tweet', // 레거시 지원
  ] as const;

  private static readonly PERMALINK_SELECTORS = [
    'a[href*="/status/"]',
    'time[datetime] a',
    '[data-testid="User-Name"] + div a', // 사용자명 옆 시간 링크
  ] as const;

  /**
   * 클릭된 요소로부터 안정적으로 트윗 ID를 추출합니다.
   * @param clickedElement 클릭된 DOM 요소
   * @returns 트윗 정보 또는 null
   */
  public static extractTweetId(clickedElement: HTMLElement): TweetExtractionResult | null {
    logger.debug('[UnifiedTweetIdExtractor] 트윗 ID 추출 시작', {
      element: clickedElement.tagName,
      className: clickedElement.className,
    });

    // 1단계: 최상위 트윗 컨테이너 탐색
    const tweetContainer = this.findTweetContainer(clickedElement);
    if (!tweetContainer) {
      logger.warn('[UnifiedTweetIdExtractor] 트윗 컨테이너를 찾을 수 없음');
      return null;
    }

    // 2단계: 컨테이너 내부에서 고유 주소 링크 검색
    const result = this.extractFromContainer(tweetContainer);
    if (result) {
      logger.debug('[UnifiedTweetIdExtractor] 트윗 ID 추출 성공', result);
      return result;
    }

    // 3단계: 폴백 - 현재 URL에서 추출 시도
    const urlResult = this.extractFromCurrentUrl();
    if (urlResult) {
      logger.debug('[UnifiedTweetIdExtractor] URL에서 트윗 ID 추출 성공', urlResult);
      return urlResult;
    }

    logger.warn('[UnifiedTweetIdExtractor] 모든 추출 방법 실패');
    return null;
  }

  /**
   * 가장 가까운 상위 트윗 컨테이너를 찾습니다.
   */
  private static findTweetContainer(element: HTMLElement): HTMLElement | null {
    for (const selector of this.TWEET_CONTAINER_SELECTORS) {
      const container = element.closest(selector) as HTMLElement;
      if (container) {
        logger.debug(`[UnifiedTweetIdExtractor] 트윗 컨테이너 발견: ${selector}`);
        return container;
      }
    }
    return null;
  }

  /**
   * 컨테이너 내부에서 트윗 정보를 추출합니다.
   */
  private static extractFromContainer(container: HTMLElement): TweetExtractionResult | null {
    // 방법 1: 고유 주소 링크에서 추출
    for (const selector of this.PERMALINK_SELECTORS) {
      const links = container.querySelectorAll(selector);
      for (const link of Array.from(links)) {
        const result = this.extractFromLink(link as HTMLAnchorElement, 'permalink');
        if (result) {
          return { ...result, confidence: 9 };
        }
      }
    }

    // 방법 2: data 속성에서 추출
    const dataResult = this.extractFromDataAttributes(container);
    if (dataResult) {
      return { ...dataResult, confidence: 7 };
    }

    return null;
  }

  /**
   * 링크 요소에서 트윗 정보를 추출합니다.
   */
  private static extractFromLink(
    link: HTMLAnchorElement,
    method: string
  ): Omit<TweetExtractionResult, 'confidence'> | null {
    const href = link.href || link.getAttribute('href');
    if (!href) return null;

    const match = href.match(/\/([^/]+)\/status\/(\d+)/);
    if (!match) return null;

    const [, username, tweetId] = match;
    if (!username || !tweetId) return null;

    const tweetUrl = this.normalizeUrl(href);

    return {
      tweetId,
      username,
      tweetUrl,
      extractionMethod: method,
    };
  }

  /**
   * 데이터 속성에서 트윗 ID를 추출합니다.
   */
  private static extractFromDataAttributes(
    container: HTMLElement
  ): Omit<TweetExtractionResult, 'confidence'> | null {
    // data-tweet-id 속성 확인
    const tweetId = container.getAttribute('data-tweet-id');
    if (tweetId && /^\d{15,20}$/.test(tweetId)) {
      // 사용자명은 링크에서 추출 시도
      const userLink = container.querySelector('a[href^="/"][href*="/status/"]');
      let username = '';
      if (userLink) {
        const userMatch = (userLink as HTMLAnchorElement).href.match(/\/([^/]+)\/status/);
        username = userMatch?.[1] || '';
      }

      return {
        tweetId,
        username,
        tweetUrl: `https://x.com/${username}/status/${tweetId}`,
        extractionMethod: 'data-attributes',
      };
    }

    return null;
  }

  /**
   * 현재 URL에서 트윗 정보를 추출합니다.
   */
  private static extractFromCurrentUrl(): TweetExtractionResult | null {
    const url = window.location.href;
    const match = url.match(/\/([^/]+)\/status\/(\d+)/);

    if (!match) return null;

    const [, username, tweetId] = match;
    if (!username || !tweetId) return null;

    return {
      tweetId,
      username,
      tweetUrl: this.normalizeUrl(url),
      extractionMethod: 'current-url',
      confidence: 8,
    };
  }

  /**
   * URL을 정규화합니다.
   */
  private static normalizeUrl(url: string): string {
    // 상대 경로를 절대 경로로 변환
    if (url.startsWith('/')) {
      return `https://x.com${url}`;
    }

    // twitter.com을 x.com으로 정규화
    return url.replace(/https?:\/\/(www\.)?twitter\.com/, 'https://x.com');
  }

  /**
   * Twitter/X.com URL인지 확인합니다.
   */
  public static isTwitterUrl(url: string): boolean {
    return /https?:\/\/(www\.)?(twitter\.com|x\.com)/.test(url);
  }
}
