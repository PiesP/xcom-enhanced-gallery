/**
 * @fileoverview DOM 구조 기반 트윗 정보 추출 전략
 * @description DOM 구조를 분석하여 트윗 정보를 추출하는 전략
 */

import { EXTRACTION_STRATEGY_PRIORITY } from '@core/constants/MEDIA_CONSTANTS';
import { logger } from '@infrastructure/logging/logger';
import type { TweetExtractionStrategy, TweetInfo } from './types';

/**
 * DOM 구조 기반 트윗 정보 추출 전략
 * 트윗 컨테이너의 DOM 구조를 분석하여 정보 추출
 */
export class DomStructureStrategy implements TweetExtractionStrategy {
  readonly name = 'DomStructureStrategy';
  readonly priority = EXTRACTION_STRATEGY_PRIORITY.DOM_BACKUP;

  /**
   * DOM 구조에서 트윗 정보 추출
   */
  extract(tweetContainer: HTMLElement, _clickedElement?: HTMLElement): TweetInfo | null {
    try {
      logger.debug('[DomStructureStrategy] DOM 구조에서 트윗 정보 추출 시도');

      // 트윗 컨테이너에서 사용자명 추출
      const username = this.extractUsername(tweetContainer);

      // 트윗 ID 추출
      const tweetId = this.extractTweetId(tweetContainer);

      if (!username || !tweetId) {
        logger.debug('[DomStructureStrategy] 필수 정보 추출 실패', { username, tweetId });
        return null;
      }

      const tweetInfo: TweetInfo = {
        tweetId,
        username,
        tweetUrl: `https://x.com/${username}/status/${tweetId}`,
        url: `https://x.com/${username}/status/${tweetId}`,
        extractionMethod: 'dom-structure',
      };

      logger.debug('[DomStructureStrategy] 트윗 정보 추출 성공', tweetInfo);
      return tweetInfo;
    } catch (error) {
      logger.error('[DomStructureStrategy] 추출 실패:', error);
      return null;
    }
  }

  /**
   * 사용자명 추출
   */
  private extractUsername(container: HTMLElement): string | null {
    // 방법 1: 프로필 링크에서 추출
    const profileLink = container.querySelector(
      'a[href^="/"][href*="/status/"]:not([href*="/status/"]) + a[href^="/"]'
    ) as HTMLAnchorElement;
    if (profileLink) {
      const match = profileLink.href.match(/\/([^/]+)$/);
      if (match?.[1]) {
        return match[1];
      }
    }

    // 방법 2: 사용자명 텍스트에서 추출 (@username 형태)
    const usernameElement = container.querySelector(
      '[data-testid="User-Name"] a, [dir="ltr"]:not(:empty)'
    );
    if (usernameElement?.textContent) {
      const usernameMatch = usernameElement.textContent.match(/@([a-zA-Z0-9_]+)/);
      if (usernameMatch?.[1]) {
        return usernameMatch[1];
      }
    }

    // 방법 3: 트윗 링크에서 추출
    const tweetLink = container.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (tweetLink) {
      const match = tweetLink.href.match(/\/([^/]+)\/status\/\d+/);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * 트윗 ID 추출
   */
  private extractTweetId(container: HTMLElement): string | null {
    // 방법 1: data-tweet-id 속성
    const tweetId = container.getAttribute('data-tweet-id');
    if (tweetId) {
      return tweetId;
    }

    // 방법 2: 상태 링크에서 추출
    const statusLink = container.querySelector('a[href*="/status/"]') as HTMLAnchorElement;
    if (statusLink) {
      const match = statusLink.href.match(/\/status\/(\d+)/);
      if (match?.[1]) {
        return match[1];
      }
    }

    // 방법 3: 시간 요소의 링크에서 추출
    const timeElement = container.querySelector('time');
    if (timeElement) {
      const parentLink = timeElement.closest('a') as HTMLAnchorElement;
      if (parentLink?.href) {
        const match = parentLink.href.match(/\/status\/(\d+)/);
        if (match?.[1]) {
          return match[1];
        }
      }
    }

    return null;
  }
}
