/**
 * @fileoverview Data Attributes Tweet Extraction Strategy
 * @description 데이터 속성에서 트윗 정보를 추출하는 전략
 */

import { logger } from '@infrastructure/logging/logger';
import type { TweetExtractionStrategy, TweetInfo } from './types';

export class DataAttributesStrategy implements TweetExtractionStrategy {
  readonly name = 'data-attributes';
  readonly priority = 3;

  extract(tweetContainer: HTMLElement): TweetInfo | null {
    logger.debug('[DataAttributesStrategy] 데이터 속성에서 추출 시작');

    // data-tweet-id 속성에서 추출
    const tweetIdFromData = this.extractTweetId(tweetContainer);
    if (tweetIdFromData) {
      const username = this.extractUsername(tweetContainer);
      if (username) {
        const result = {
          username,
          tweetId: tweetIdFromData,
          tweetUrl: `https://x.com/${username}/status/${tweetIdFromData}`,
        };
        logger.debug('[DataAttributesStrategy] 데이터 속성에서 추출 성공', result);
        return result;
      }
    }

    logger.debug('[DataAttributesStrategy] 데이터 속성에서 추출 실패');
    return null;
  }

  private extractTweetId(container: HTMLElement): string | null {
    // 다양한 데이터 속성 시도
    const selectors = ['[data-tweet-id]', '[data-testid*="tweet"]', '[data-id]', '[data-item-id]'];

    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        const tweetId =
          element.getAttribute('data-tweet-id') ??
          element.getAttribute('data-id') ??
          element.getAttribute('data-item-id');

        if (tweetId && /^\d{15,20}$/.test(tweetId)) {
          return tweetId;
        }
      }
    }

    return null;
  }

  private extractUsername(container: HTMLElement): string | null {
    // 사용자명 추출을 위한 다양한 선택자 시도
    const selectors = [
      '[data-screen-name]',
      '[data-username]',
      'a[href^="/"]:not([href*="/status/"]):not([href*="/photo/"]):not([href*="/video/"])',
      '[data-testid="User-Name"] a',
      '.username',
      '[title*="@"]',
    ];

    for (const selector of selectors) {
      const element = container.querySelector(selector);
      if (element) {
        // 데이터 속성에서 먼저 시도
        const username =
          element.getAttribute('data-screen-name') ?? element.getAttribute('data-username');

        if (username) {
          return username.replace(/^@/, '');
        }

        // href에서 추출
        if (element.tagName === 'A') {
          const href = (element as HTMLAnchorElement).href;
          const match = href.match(/x\.com\/([^/]+)/);
          if (match?.[1] && !match[1].includes('status')) {
            return match[1];
          }
        }

        // 텍스트에서 추출
        const text = element.textContent?.trim();
        if (text) {
          const usernameMatch = text.match(/@([a-zA-Z0-9_]+)/);
          if (usernameMatch?.[1]) {
            return usernameMatch[1];
          }
        }
      }
    }

    return null;
  }
}
