/**
 * @fileoverview DOM 구조 기반 트윗 정보 추출 전략
 */

import { logger } from '@shared/logging/logger';
import { parseUsernameFast } from '@shared/services/media/UsernameExtractionService';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';
import { MediaOwnershipValidator } from '../utils/MediaOwnershipValidator';

export class DomStructureTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'dom-structure';
  readonly priority = 3;

  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      // 1. closest()로 가능한 모든 article 후보 찾기
      const immediateContainer = element.closest('[data-testid="tweet"], article');
      if (!immediateContainer) return null;

      // 2. 소유권 검증
      const validation = MediaOwnershipValidator.validate(
        element,
        immediateContainer as HTMLElement
      );

      if (!validation.isValid) {
        logger.debug('[DomStructureTweetStrategy] 소유권 검증 실패:', {
          reason: validation.reason,
          confidence: validation.confidence,
          distance: validation.distance,
        });
        return null;
      }

      // 3. 트윗 ID 추출
      const tweetId = this.findTweetIdInContainer(immediateContainer as HTMLElement);
      if (!tweetId) return null;

      // 4. Username 추출
      const username =
        this.findUsernameInContainer(immediateContainer as HTMLElement) ||
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
        confidence: validation.confidence, // 거리 기반 동적 신뢰도
        metadata: {
          containerTag: immediateContainer.tagName.toLowerCase(),
          ownershipDistance: validation.distance,
          ownershipValid: validation.isValid,
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
    // 1. href="/username" 패턴 (@ 없이)
    const usernameLinks = container.querySelectorAll('a[href^="/"]');
    for (const link of usernameLinks) {
      const href = link.getAttribute('href');
      if (!href) continue;

      // /status/ 링크는 제외
      if (href.includes('/status/')) continue;

      // 단순 username 패턴: /username (추가 경로 없음)
      const match = href.match(/^\/([^/?#]+)$/);
      if (match?.[1]) {
        const username = match[1];
        // @로 시작하면 제거
        return username.startsWith('@') ? username.slice(1) : username;
      }
    }

    // 2. href 내 @ 포함 패턴
    const atLinks = container.querySelectorAll('a[href*="@"]');
    for (const link of atLinks) {
      const href = link.getAttribute('href');
      if (!href || href.includes('/status/')) continue;

      const match = href.match(/^\/(@?[^/?#]+)$/);
      if (match?.[1]) {
        const username = match[1];
        return username.startsWith('@') ? username.slice(1) : username;
      }
    }

    return null;
  }
}
