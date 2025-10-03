/**
 * @fileoverview DOM 구조 기반 트윗 정보 추출 전략
 * @description closest() 메서드를 사용하여 가장 가까운 트윗 컨테이너 찾기
 *
 * Phase 2 개선사항 (Epic MEDIA-EXTRACTION-FIX):
 * - MediaOwnershipValidator 통합으로 멘션된 트윗 버그 수정
 * - 동적 신뢰도 계산 (고정값 0.7 → 거리 기반 0.0~1.0)
 * - 향상된 username 추출 (두 단계: /username → /@username)
 *
 * 버그 해결:
 * - Before: closest()가 부모 트윗을 찾아 잘못된 tweet ID 반환
 * - After: 소유권 검증으로 실제 미디어 소유 트윗만 추출
 */

import { logger } from '@shared/logging/logger';
import { parseUsernameFast } from '@shared/services/media/UsernameExtractionService';
import type { TweetInfo, TweetInfoExtractionStrategy } from '@shared/types/media.types';
import { MediaOwnershipValidator } from '../utils/MediaOwnershipValidator';

/**
 * DOM 구조 기반 트윗 정보 추출 전략
 *
 * 우선순위: 3 (중간)
 * 정확도: 높음 (소유권 검증 후)
 * 성능: 빠름 (DOM 탐색만)
 */
export class DomStructureTweetStrategy implements TweetInfoExtractionStrategy {
  readonly name = 'dom-structure';
  readonly priority = 3;

  /**
   * 미디어 요소에서 트윗 정보 추출
   *
   * 추출 단계:
   * 1. closest()로 가장 가까운 article 찾기
   * 2. MediaOwnershipValidator로 소유권 검증
   * 3. 트윗 ID 추출 (status link)
   * 4. Username 추출 (two-pass algorithm)
   *
   * @param element 미디어 요소 (img, video 등)
   * @returns 트윗 정보 또는 null (추출 실패 시)
   */
  async extract(element: HTMLElement): Promise<TweetInfo | null> {
    try {
      // 1. closest()로 가능한 모든 article 후보 찾기
      const immediateContainer = element.closest('[data-testid="tweet"], article');
      if (!immediateContainer) return null;

      // 2. 소유권 검증 (핵심: 멘션된 트윗 버그 방지)
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

      // 4. Username 추출 (fallback chain)
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
