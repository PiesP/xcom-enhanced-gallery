/**
 * @fileoverview DOM 구조 기반 트윗 정보 추출 전략
 */

import { logger } from '@shared/logging/logger';
import { parseUsernameFast } from '../../media/UsernameExtractionService';
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

      const username =
        this.findUsernameInContainer(tweetContainer as HTMLElement) ||
        parseUsernameFast() ||
        'fallback';

      if (!username || username === 'fallback') {
        logger.debug('DomStructureTweetStrategy: 사용자명 추출 실패');
        return null;
      }

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
      logger.error('[DomStructureTweetStrategy] 추출 오류:', error);
      return null;
    }
  }

  private findTweetIdInContainer(container: HTMLElement): string | null {
    // 링크에서 트윗 ID 찾기
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
    const usernameLinks = container.querySelectorAll(
      'a[href^="/"][href*="@"]:not([href*="/status/"])'
    );
    for (const link of usernameLinks) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/^\/([^/]+)$/);
        if (match) return match[1] ?? null;
      }
    }
    return null;
  }
}
