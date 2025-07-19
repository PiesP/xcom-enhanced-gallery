/**
 * @fileoverview 데이터 속성 기반 트윗 정보 추출 전략
 */

import { logger } from '@core/logging/logger';
import type { TweetInfo, TweetInfoExtractionStrategy } from '../interfaces/extraction.interfaces';

export class DataAttributeTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'data-attribute';
  readonly priority = 4;

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      let current: HTMLElement | null = element;

      for (let i = 0; i < 5 && current; i++) {
        const tweetId = this.extractTweetIdFromElement(current);
        if (tweetId) {
          const username = this.extractUsernameFromElement(current) || 'unknown';

          return {
            tweetId,
            username,
            tweetUrl: `https://twitter.com/${username}/status/${tweetId}`,
            extractionMethod: 'data-attribute',
            confidence: 0.6,
            metadata: {
              elementLevel: i,
            },
          };
        }
        current = current.parentElement;
      }

      return null;
    } catch (error) {
      logger.error('[DataAttributeTweetStrategy] 추출 오류:', error);
      return null;
    }
  }

  private extractTweetIdFromElement(element: HTMLElement): string | null {
    const attributes = ['data-tweet-id', 'data-item-id', 'data-key'];

    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && /^\d+$/.test(value)) {
        return value;
      }
    }
    return null;
  }

  private extractUsernameFromElement(element: HTMLElement): string | null {
    const usernameAttrs = ['data-screen-name', 'data-username'];

    for (const attr of usernameAttrs) {
      const value = element.getAttribute(attr);
      if (value) return value;
    }
    return null;
  }
}
