/**
 * @fileoverview URL 기반 트윗 정보 추출 전략
 * @description 현재 페이지 URL에서 트윗 정보를 추출하는 전략
 */

import { logger } from '@shared/logging/logger';
import { parseUsernameFast } from '@shared/services/media/username-extraction-service';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';

/**
 * URL 기반 트윗 추출 전략
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

      const username = this.extractUsernameFromUrl(currentUrl) || parseUsernameFast() || 'fallback';

      if (!username || username === 'fallback') {
        logger.debug('UrlBasedTweetStrategy: 사용자명 추출 실패');
        return null;
      }

      return {
        tweetId,
        username,
        tweetUrl: `https://twitter.com/${username}/status/${tweetId}`,
        extractionMethod: 'url-based',
        confidence: 0.8,
        metadata: {
          sourceUrl: currentUrl,
        },
      };
    } catch (error) {
      logger.error('[UrlBasedTweetStrategy] 추출 오류:', error);
      return null;
    }
  }

  private extractTweetIdFromUrl(url: string): string | null {
    const match = url.match(/\/status\/(\d+)/);
    return match ? (match[1] ?? null) : null;
  }

  private extractUsernameFromUrl(url: string): string | null {
    const match = url.match(/twitter\.com\/([^/]+)\//);
    return match ? (match[1] ?? null) : null;
  }
}
