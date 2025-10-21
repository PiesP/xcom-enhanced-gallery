/**
 * @fileoverview 클릭된 요소 기반 트윗 정보 추출 전략
 * @description 클릭된 요소에서 직접 트윗 정보를 추출하는 최우선 전략
 */

import { logger } from '@shared/logging/logger';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

/**
 * 클릭된 요소 기반 트윗 추출 전략
 */
export class ClickedElementTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'clicked-element';
  readonly priority = 1;

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      if (!element) return null;
      // 1. 데이터 속성에서 직접 추출
      const directTweetId = this.extractFromDataAttributes(element);
      if (directTweetId) {
        const tweetInfo = await this.buildTweetInfo(directTweetId, element, 'data-attributes');
        if (tweetInfo) return tweetInfo;
      }

      // 2. aria-labelledby에서 추출
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      if (ariaLabelledBy) {
        const tweetId = this.extractTweetIdFromAriaLabel(ariaLabelledBy);
        if (tweetId) {
          const tweetInfo = await this.buildTweetInfo(tweetId, element, 'aria-labelledby');
          if (tweetInfo) return tweetInfo;
        }
      }

      // 3. href 속성에서 추출
      const href = element.getAttribute('href');
      if (href) {
        const tweetId = this.extractTweetIdFromUrl(href);
        if (tweetId) {
          const tweetInfo = await this.buildTweetInfo(tweetId, element, 'href-attribute');
          if (tweetInfo) return tweetInfo;
        }
      }

      // 4. 상위 트윗 컨테이너 기반 추출 (URL 기반 전략보다 우선)
      //    트윗 상세 페이지에서 멘션/인용 트윗 내 이미지를 클릭한 경우를 정확히 처리
      const containerTweetId = this.extractTweetIdFromAncestorContainer(element);
      if (containerTweetId) {
        const tweetInfo = await this.buildTweetInfo(
          containerTweetId,
          element,
          'ancestor-container'
        );
        if (tweetInfo) return tweetInfo;
      }

      return null;
    } catch (error) {
      logger.error('[ClickedElementTweetStrategy] 추출 오류:', error);
      return null;
    }
  }

  /**
   * 데이터 속성에서 트윗 ID 추출
   */
  private extractFromDataAttributes(element: HTMLElement): string | null {
    const attributes = ['data-tweet-id', 'data-item-id', 'data-testid', 'data-focusable'];

    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && /^\d+$/.test(value)) {
        return value;
      }
    }

    return null;
  }

  /**
   * aria-labelledby에서 트윗 ID 추출
   */
  private extractTweetIdFromAriaLabel(ariaLabelledBy: string): string | null {
    const match = ariaLabelledBy.match(/id__(\d+)/);
    return match ? (match[1] ?? null) : null;
  }

  /**
   * URL에서 트윗 ID 추출
   */
  private extractTweetIdFromUrl(url: string): string | null {
    // /status/1234567890 패턴
    const statusMatch = url.match(/\/status\/(\d+)/);
    if (statusMatch) return statusMatch[1] ?? null;

    // /photo/1 형태에서 상위 URL 확인 필요
    const photoMatch = url.match(/\/photo\/\d+$/);
    if (photoMatch) {
      // 현재 페이지 URL에서 추출 시도
      const currentUrl = window.location.href;
      const urlTweetId = this.extractTweetIdFromUrl(currentUrl);
      if (urlTweetId) return urlTweetId;
    }

    return null;
  }

  /**
   * 상위 트윗 컨테이너에서 트윗 ID 추출
   * [data-testid="tweet"] 또는 article을 컨테이너로 간주하고,
   * 해당 컨테이너 내부의 status 링크에서 ID를 찾습니다.
   *
   * 멘션/인용 트윗 영역 클릭 시 현재 페이지 URL이 아닌 실제 클릭된 컨테이너의
   * 트윗 ID를 우선하도록 합니다.
   */
  private extractTweetIdFromAncestorContainer(element: HTMLElement): string | null {
    // 가장 가까운 안정적인 트윗 컨테이너 탐색 (최대 10레벨 방어)
    let current: HTMLElement | null = element;
    for (let i = 0; i < 10 && current; i++) {
      const container = current.closest('[data-testid="tweet"], article') as HTMLElement | null;
      if (container) {
        const id = this.findTweetIdInContainer(container);
        if (id) return id;
      }
      current = current.parentElement;
    }
    return null;
  }

  /** 컨테이너 내부에서 /status/ 링크로 트윗 ID 찾기 */
  private findTweetIdInContainer(container: HTMLElement): string | null {
    const links = container.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href) continue;
      const match = href.match(/\/status\/(\d+)/);
      if (match?.[1]) return match[1];
    }
    // time>parent a[href*="/status/"] 패턴 보조 처리
    const times = container.querySelectorAll('time');
    for (const time of times) {
      const parentLink = time.closest('a[href*="/status/"]');
      const href = parentLink?.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match?.[1]) return match[1];
      }
    }
    return null;
  }

  /**
   * 트윗 정보 구성
   */
  private async buildTweetInfo(
    tweetId: string,
    element: HTMLElement,
    method: string
  ): Promise<TweetInfo | null> {
    try {
      // 사용자명 추출 시도
      const username = this.extractUsername(element) || 'unknown';

      // 트윗 URL 구성
      const tweetUrl = `https://twitter.com/${username}/status/${tweetId}`;

      return {
        tweetId,
        username,
        tweetUrl,
        extractionMethod: `clicked-element-${method}`,
        confidence: 0.9,
        metadata: {
          element: element.tagName.toLowerCase(),
          method,
        },
      };
    } catch (error) {
      logger.error('[ClickedElementTweetStrategy] 트윗 정보 구성 오류:', error);
      return null;
    }
  }

  /**
   * 사용자명 추출
   */
  private extractUsername(element: HTMLElement): string | null {
    // 1. 부모 요소에서 사용자명 찾기
    let current: HTMLElement | null = element;
    for (let i = 0; i < 10 && current; i++) {
      const usernameElement = current.querySelector(
        '[href^="/"]:not([href*="/status/"]):not([href*="/photo/"]):not([href*="/video/"])'
      );
      if (usernameElement) {
        const href = usernameElement.getAttribute('href');
        // href가 "/username" 형식인지 확인 (맨 앞의 / 이후에는 추가 /가 없어야 함)
        if (href && href.startsWith('/') && href.lastIndexOf('/') === 0) {
          return href.substring(1); // / 제거
        }
      }
      current = current.parentElement;
    }

    // 2. 현재 URL에서 추출
    const urlMatch = window.location.pathname.match(/^\/([^/]+)\//);
    if (urlMatch) {
      return urlMatch[1] ?? null;
    }

    return null;
  }
}
