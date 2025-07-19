/**
 * @fileoverview 부모 요소 탐색 기반 트윗 정보 추출 전략
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, TweetInfoExtractionStrategy } from '../interfaces/extraction.interfaces';

export class ParentTraversalTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'parent-traversal';
  readonly priority = 5;

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      let current: HTMLElement | null = element;

      for (let i = 0; i < 10 && current; i++) {
        const tweetId = this.findTweetIdInElement(current);
        if (tweetId) {
          const username = this.findUsernameInElement(current) || 'unknown';

          return {
            tweetId,
            username,
            tweetUrl: `https://twitter.com/${username}/status/${tweetId}`,
            extractionMethod: 'parent-traversal',
            confidence: 0.5,
            metadata: {
              parentLevel: i,
            },
          };
        }
        current = current.parentElement;
      }

      return null;
    } catch (error) {
      logger.error('[ParentTraversalTweetStrategy] 추출 오류:', error);
      return null;
    }
  }

  private findTweetIdInElement(element: HTMLElement): string | null {
    // 링크에서 트윗 ID 찾기
    const statusLinks = element.querySelectorAll('a[href*="/status/"]');
    for (const link of statusLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }

  private findUsernameInElement(element: HTMLElement): string | null {
    // 사용자명 링크 찾기
    const userLinks = element.querySelectorAll('a[href^="/"]');
    for (const link of userLinks) {
      const href = link.getAttribute('href');
      if (href && !href.includes('/status/') && !href.includes('/photo/')) {
        const match = href.match(/^\/([^/]+)$/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }
}
