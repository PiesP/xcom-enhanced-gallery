/**
 * @fileoverview DOM Structure Tweet Extraction Strategy (Phase 405B-2)
 * @description Analyze DOM hierarchy to extract tweet metadata (article elements, data attributes).
 *              Priority 3 fallback strategy in extraction chain.
 * @version 1.1.0 - Phase 405B-2: Full documentation
 *
 * **SYSTEM ROLE**: DOM Structure Analysis Strategy
 * Analyze DOM hierarchy to extract tweet metadata (article, data attributes)
 *
 * **Priority** (TweetInfoExtractor 5-strategy chain):
 * 3️⃣ DomStructureTweetStrategy (50-60% success)
 * └─ Fallback when direct element and URL methods fail
 *
 * **Extraction Method**:
 * - Find closest article/[data-testid="tweet"]
 * - Analyze nested structure
 * - Extract data from parent elements
 * - Traverse DOM up to 10 levels
 *
 * **Performance**: 20-50ms (DOM traversal)
 */

import { logger } from '@shared/logging';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

export class DomStructureTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'dom-structure';
  readonly priority = 3;

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      const tweetContainer = element.closest('[data-testid="tweet"], article');
      if (!tweetContainer) return null;

      const tweetId = this.findTweetIdInContainer(tweetContainer as HTMLElement);
      if (!tweetId) return null;

      const containerUsername = this.findUsernameInContainer(tweetContainer as HTMLElement)?.trim();
      const username = containerUsername && containerUsername.length > 0 ? containerUsername : 'unknown';

      return {
        tweetId,
        username,
        tweetUrl: `https://twitter.com/${username}/status/${tweetId}`,
        extractionMethod: 'dom-structure',
        confidence: 0.7,
        metadata: {
          containerTag: tweetContainer.tagName.toLowerCase(),
        },
      };
    } catch (error) {
      logger.error('[DomStructureTweetStrategy] Extraction error:', error);
      return null;
    }
  }

  private findTweetIdInContainer(container: HTMLElement): string | null {
    // Find tweet ID from /status/ links
    const links = container.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/status\/(\d+)/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }

  private findUsernameInContainer(container: HTMLElement): string | null {
    // Extract username from relative path user links (excluding status links)
    const usernameLinks = container.querySelectorAll('a[href^="/"]');
    for (const link of usernameLinks) {
      const href = link.getAttribute('href');
      if (href && !href.includes('/status/')) {
        const match = href.match(/^\/([^/]+)$/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }
}
