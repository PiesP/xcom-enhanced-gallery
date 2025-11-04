/**
 * @fileoverview 인용 리트윗 감지 및 DOM 구조 분석
 * @description X.com 인용 리트윗(Quote Tweet)의 중첩 DOM 구조를 분석하고
 *              정확한 미디어 컨테이너를 찾는 유틸리티 클래스
 * @version 1.0.0 - Phase 342: Quote Tweet Media Extraction
 */

import { logger } from '@shared/logging';
import type { QuoteTweetInfo } from '@shared/types/media.types';

/**
 * 인용 리트윗 DOM 구조 분석 결과
 *
 * @interface QuoteTweetStructure
 * @property {boolean} isQuoteTweet - 인용 리트윗 여부
 * @property {string} clickedLocation - 클릭된 위치 ('quoted' | 'original' | 'unknown')
 * @property {HTMLElement | null} outerArticle - 외부 article 요소 (인용 리트윗 작성자)
 * @property {HTMLElement | null} innerArticle - 내부 article 요소 (원본 트윗)
 * @property {HTMLElement | null} targetArticle - 타겟 article (실제 미디어를 포함한 요소)
 */
export interface QuoteTweetStructure {
  /** 인용 리트윗 여부 */
  isQuoteTweet: boolean;
  /** 클릭된 위치 */
  clickedLocation: 'quoted' | 'original' | 'unknown';
  /** 외부 article 요소 (인용 리트윗 작성자) */
  outerArticle: HTMLElement | null;
  /** 내부 article 요소 (원본 트윗) */
  innerArticle: HTMLElement | null;
  /** 타겟 article (실제 미디어를 포함한 article) */
  targetArticle: HTMLElement | null;
}

/**
 * 인용 리트윗 감지 클래스
 *
 * DOM 구조를 분석하여 인용 리트윗인지 판단하고,
 * 클릭된 위치에 따라 올바른 미디어 컨테이너를 찾습니다.
 *
 * @example
 * ```typescript
 * const element = document.querySelector('img');
 * const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(element);
 *
 * if (structure.isQuoteTweet) {
 *   // 인용 리트윗 처리
 *   const mediaContainer = structure.targetArticle?.querySelector('img');
 * }
 * ```
 */
export class QuoteTweetDetector {
  private static readonly TWEET_SELECTOR = 'article[data-testid="tweet"]';

  /**
   * 클릭된 요소로부터 인용 리트윗 DOM 구조 분석
   *
   * DOM 계층을 상향식으로 탐색하여 모든 article 요소를 수집하고,
   * 중첩 관계를 분석하여 인용 리트윗 여부를 판단합니다.
   *
   * @param {HTMLElement} element - 클릭된 요소
   * @returns {QuoteTweetStructure} 인용 리트윗 구조 정보
   *
   * @example
   * ```typescript
   * // 일반 트윗
   * const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(img);
   * // { isQuoteTweet: false, clickedLocation: 'original', targetArticle: article }
   *
   * // 인용 리트윗 (원본 이미지 클릭)
   * const structure = QuoteTweetDetector.analyzeQuoteTweetStructure(img);
   * // { isQuoteTweet: true, clickedLocation: 'quoted', targetArticle: innerArticle }
   * ```
   */
  static analyzeQuoteTweetStructure(element: HTMLElement): QuoteTweetStructure {
    logger.debug('[QuoteTweetDetector] 분석 시작', {
      element: element.tagName,
      elementClass: element.className.substring(0, 50),
    });

    try {
      // 1. 모든 조상 article 수집
      const articles = this.collectAncestorArticles(element);

      if (articles.length === 0) {
        logger.debug('[QuoteTweetDetector] article 요소 없음');
        return this.createStructure(false, 'unknown', null, null, null);
      }

      // 2. 일반 트윗 (article이 1개만 있음)
      if (articles.length === 1) {
        logger.debug('[QuoteTweetDetector] 일반 트윗 감지');
        const article = articles[0] ?? null;
        return this.createStructure(false, 'original', article, null, article);
      }

      // 3. 인용 리트윗 (article이 2개 이상 있음)
      // articles는 가장 가까운 것부터 정렬되어 있음 [innerArticle, outerArticle, ...]
      const innerArticle = articles[0];
      const outerArticle = articles[1];

      // innerArticle이 반드시 있는지 확인
      if (!innerArticle || !outerArticle) {
        logger.debug('[QuoteTweetDetector] 예상치 못한 article 구조');
        return this.createStructure(false, 'unknown', null, null, null);
      }

      // 클릭된 요소가 내부 article에 포함되는지 확인
      const clickedInInner = innerArticle.contains(element);
      const location: 'quoted' | 'original' = clickedInInner ? 'quoted' : 'original';
      const targetArticle = clickedInInner ? innerArticle : outerArticle;

      logger.info('[QuoteTweetDetector] 인용 리트윗 감지', {
        clickedLocation: location,
        articleDepth: articles.length,
      });

      return this.createStructure(
        true,
        location,
        outerArticle ?? null,
        innerArticle ?? null,
        targetArticle ?? null
      );
    } catch (error) {
      logger.error('[QuoteTweetDetector] 분석 오류:', error);
      return this.createStructure(false, 'unknown', null, null, null);
    }
  }

  /**
   * 인용 리트윗 메타데이터 추출
   *
   * 분석된 DOM 구조로부터 인용 리트윗의 메타데이터를 추출합니다.
   *
   * @param {HTMLElement} element - 클릭된 요소
   * @returns {QuoteTweetInfo} 인용 리트윗 정보
   *
   * @example
   * ```typescript
   * const info = QuoteTweetDetector.extractQuoteTweetMetadata(element);
   * console.log(info);
   * // {
   * //   isQuoteTweet: true,
   * //   clickedLocation: 'quoted',
   * //   quotedTweetId: '1234567890',
   * //   quotedUsername: 'original_author',
   * //   sourceLocation: 'quoted'
   * // }
   * ```
   */
  static extractQuoteTweetMetadata(element: HTMLElement): QuoteTweetInfo {
    const structure = this.analyzeQuoteTweetStructure(element);

    if (!structure.isQuoteTweet || !structure.innerArticle) {
      return {
        isQuoteTweet: false,
        clickedLocation: structure.clickedLocation,
      };
    }

    // 내부 article에서 트윗 ID와 작성자 추출
    const quotedTweetId = this.extractTweetIdFromArticle(structure.innerArticle);
    const quotedUsername = this.extractUsernameFromArticle(structure.innerArticle);

    logger.debug('[QuoteTweetDetector] 메타데이터 추출', {
      quotedTweetId,
      quotedUsername,
    });

    return {
      isQuoteTweet: true,
      clickedLocation: structure.clickedLocation,
      quotedTweetId: quotedTweetId ?? undefined,
      quotedUsername: quotedUsername ?? undefined,
      sourceLocation: structure.clickedLocation === 'quoted' ? 'quoted' : 'original',
    };
  }

  /**
   * 정확한 미디어 컨테이너 찾기 (인용 리트윗 대응)
   *
   * 인용 리트윗 구조를 분석하여 타겟 article 내에서만
   * 미디어 컨테이너를 검색합니다.
   *
   * @param {HTMLElement} element - 클릭된 요소
   * @returns {HTMLElement | null} 미디어 컨테이너 요소 또는 null
   *
   * @example
   * ```typescript
   * const mediaContainer = QuoteTweetDetector.getMediaContainerForQuoteTweet(element);
   * if (mediaContainer) {
   *   const media = mediaContainer.querySelector('img, video');
   * }
   * ```
   */
  static getMediaContainerForQuoteTweet(element: HTMLElement): HTMLElement | null {
    const structure = this.analyzeQuoteTweetStructure(element);

    if (!structure.targetArticle) {
      logger.debug('[QuoteTweetDetector] targetArticle 없음');
      return null;
    }

    // 직접 자식 및 깊이 1-2 단계 내에서 미디어 찾기
    const mediaSelectors = [
      ':scope > div > [data-testid="tweetPhoto"]',
      ':scope > div > [data-testid="videoPlayer"]',
      ':scope > div > img[src*="pbs.twimg.com"]',
      ':scope > div > video',
    ];

    for (const selector of mediaSelectors) {
      const media = structure.targetArticle?.querySelector(selector) as HTMLElement | null;
      if (media) {
        logger.debug('[QuoteTweetDetector] 미디어 컨테이너 발견', {
          selector,
          mediaTag: media.tagName,
        });
        return media;
      }
    }

    logger.debug('[QuoteTweetDetector] 미디어 컨테이너를 찾을 수 없음');
    return null;
  }

  /**
   * 모든 조상 article 요소 수집
   *
   * DOM 계층을 상향식으로 탐색하여 모든 article 요소를 수집합니다.
   * 가장 가까운 것부터 순서대로 배열됩니다.
   *
   * @private
   * @param {HTMLElement} element - 시작 요소
   * @returns {HTMLElement[]} article 요소 배열 (가장 가까운 것 먼저)
   */
  private static collectAncestorArticles(element: HTMLElement): HTMLElement[] {
    const articles: HTMLElement[] = [];
    let current: HTMLElement | null = element;

    while (current) {
      if (current.matches(this.TWEET_SELECTOR)) {
        articles.push(current);
      }
      current = current.parentElement;
    }

    return articles;
  }

  /**
   * 구조 객체 생성
   *
   * @private
   * @param {boolean} isQuoteTweet - 인용 리트윗 여부
   * @param {string} clickedLocation - 클릭 위치
   * @param {HTMLElement | null} outerArticle - 외부 article
   * @param {HTMLElement | null} innerArticle - 내부 article
   * @param {HTMLElement | null} targetArticle - 타겟 article
   * @returns {QuoteTweetStructure} 구조 객체
   */
  private static createStructure(
    isQuoteTweet: boolean,
    clickedLocation: 'quoted' | 'original' | 'unknown',
    outerArticle: HTMLElement | null,
    innerArticle: HTMLElement | null,
    targetArticle: HTMLElement | null
  ): QuoteTweetStructure {
    return {
      isQuoteTweet,
      clickedLocation,
      outerArticle,
      innerArticle,
      targetArticle,
    };
  }

  /**
   * Article에서 트윗 ID 추출
   *
   * URL 패턴 `/status/[트윗ID]`를 찾아 추출합니다.
   *
   * @private
   * @param {HTMLElement} article - article 요소
   * @returns {string | null} 트윗 ID 또는 null
   */
  private static extractTweetIdFromArticle(article: HTMLElement): string | null {
    const links = article.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match?.[1]) {
          return match[1];
        }
      }
    }
    return null;
  }

  /**
   * Article에서 사용자명 추출
   *
   * 상대 경로 링크에서 사용자명을 추출합니다.
   * `/status/` 형태는 제외합니다.
   *
   * @private
   * @param {HTMLElement} article - article 요소
   * @returns {string | null} 사용자명 또는 null
   *
   * @example
   * ```
   * href="/john_doe" → "john_doe"
   * href="/john_doe/status/123" → 제외 (status 포함)
   * ```
   */
  private static extractUsernameFromArticle(article: HTMLElement): string | null {
    const userLinks = article.querySelectorAll('a[href^="/"]');
    for (const link of userLinks) {
      const href = link.getAttribute('href');
      if (href && !href.includes('/status/') && href !== '/') {
        // `/username` 형태에서 `/` 제거
        const username = href.substring(1);
        if (username) {
          return username;
        }
      }
    }
    return null;
  }
}
