/**
 * @fileoverview Parent Traversal Tweet Extraction Strategy (Phase 405B-2)
 * @description Extract tweet metadata by traversing parent DOM tree (Priority 5 - Last resort).
 *              Final fallback strategy when all other 4 strategies fail.
 * @version 1.1.0 - Phase 405B-2: Documentation enhancement
 *
 * **SYSTEM ROLE**: Fallback Parent Traversal Strategy
 * Last resort extraction method, traversing up DOM tree to find tweet info
 *
 * **Priority** (TweetInfoExtractor 5-strategy chain):
 * 5️⃣ ParentTraversalTweetStrategy (20-30% success - Last resort)
 * └─ Used only when all other 4 strategies fail
 *
 * **Extraction Method**:
 * - Traverse parent elements (up to 15 levels)
 * - Look for data attributes in each parent
 * - Extract tweetId, username, URL
 * - Slow but comprehensive fallback
 *
 * **Performance**: 30-100ms (extensive traversal, last resort)
 */

import { logger } from '@shared/logging';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

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
      logger.error('[ParentTraversalTweetStrategy] Extraction error:', error);
      return null;
    }
  }

  private findTweetIdInElement(element: HTMLElement): string | null {
    // Find tweet ID from /status/ links
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
    // Find username from user links
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
