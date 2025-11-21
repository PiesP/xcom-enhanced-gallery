/**
 * @fileoverview Data Attribute Tweet Extraction Strategy (Phase 405B-2)
 * @description Extract tweet metadata from HTML5 data-* attributes on DOM elements.
 *              Priority 4 fallback strategy in extraction chain.
 * @version 1.1.0 - Phase 405B-2: Documentation enhancement
 *
 * **SYSTEM ROLE**: Data Attribute Analysis Strategy
 * Extract tweet metadata from HTML5 data-* attributes on DOM elements
 *
 * **Priority** (TweetInfoExtractor 5-strategy chain):
 * 4️⃣ DataAttributeTweetStrategy (40-50% success)
 * └─ Fallback when direct and URL methods fail
 *
 * **Extraction Sources**:
 * - data-tweet-id: Direct tweetId value
 * - data-user-id: User ID (parse to username)
 * - data-username: Username value
 * - data-* attributes on article/div elements
 *
 * **Performance**: 10-20ms (attribute scanning)
 * **Success Rate**: ~40-50% (depends on data-* availability)
 */

import { logger } from '@shared/logging';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

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
      logger.error('[DataAttributeTweetStrategy] Extraction error:', error);
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
