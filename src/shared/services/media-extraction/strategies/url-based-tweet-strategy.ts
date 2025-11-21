/**
 * @fileoverview URL-Based Tweet Extraction Strategy (Phase 405B-2)
 * @description Extract tweet ID and username from current page URL (browser location).
 *              Priority 2 fallback strategy in extraction chain.
 * @version 1.1.0 - Phase 405B-2: Documentation enhancement
 *
 * **SYSTEM ROLE**: URL Pattern-Based Strategy
 * Extract tweet ID and username from current page URL (browser location)
 *
 * **Priority** (TweetInfoExtractor 5-strategy chain):
 * 2️⃣ UrlBasedTweetStrategy (60-70% success)
 * └─ Fallback when direct element method fails
 *
 * **Extraction Method**:
 * - Parse window.location.href
 * - Extract tweetId from URL path (/status/123456789)
 * - Extract username from URL path (/@username/status/...)
 * - Validate extracted values
 *
 * **Examples**:
 * - https://x.com/@user/status/1234567890 → tweetId: 1234567890
 * - https://x.com/user/status/9876543210 → username: user
 *
 * **Performance**: 5-10ms (URL parsing only)
 * **Success Rate**: ~60-70% (depends on page context)
 */

import { logger } from '@shared/logging';
import { parseUsernameFast } from '@shared/services/media/username-extraction-service';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

/**
 * URL-based tweet extraction strategy implementation.
 *
 * Extracts tweet ID and username from current page URL path:
 * - Pattern: /(username)/status/(tweetId)
 * - Examples: x.com/@user/status/123... or x.com/user/status/456...
 */
export class UrlBasedTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'url-based';
  readonly priority = 2;

  async extract(_element: HTMLElement): Promise<TweetInfo | null> {
    try {
      const currentUrl = window.location.href;
      const tweetId = this.extractTweetIdFromUrl(currentUrl);

      if (!tweetId) {
        return null;
      }

      const primaryUsername = this.extractUsernameFromUrl(currentUrl)?.trim() ?? null;
      let resolvedUsername = primaryUsername && primaryUsername.length > 0 ? primaryUsername : null;

      if (!resolvedUsername) {
        const fallbackUsername = parseUsernameFast()?.trim();
        if (fallbackUsername && fallbackUsername.length > 0) {
          resolvedUsername = fallbackUsername;
        }
      }

      if (!resolvedUsername) {
        logger.debug('UrlBasedTweetStrategy: Username extraction failed');
        return null;
      }

      return {
        tweetId,
        username: resolvedUsername,
        tweetUrl: `https://twitter.com/${resolvedUsername}/status/${tweetId}`,
        extractionMethod: 'url-based',
        confidence: 0.8,
        metadata: {
          sourceUrl: currentUrl,
        },
      };
    } catch (error) {
      logger.error('[UrlBasedTweetStrategy] Extraction error:', error);
      return null;
    }
  }

  private extractTweetIdFromUrl(url: string): string | null {
    const match = url.match(/\/status\/(\d+)/);
    return match ? (match[1] ?? null) : null;
  }

  private extractUsernameFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Check if host is twitter/x
      if (!/(?:^|\.)(?:twitter|x)\.com$/.test(urlObj.hostname)) {
        return null;
      }

      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const username = pathSegments[0] ?? null;
        if (username === 'status') return null;
        return username;
      }
      return null;
    } catch {
      return null;
    }
  }
}
