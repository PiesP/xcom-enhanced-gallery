/**
 * @fileoverview 사용자명 추출 통합 유틸리티
 * @description Twitter/X.com에서 사용자명을 안전하게 추출하는 통합 서비스
 * @version 1.0.0 - Core 레이어로 이동
 * @moved-from shared/utils/media/username-extraction.ts
 */

import { logger } from '@shared/logging/logger';
import { SYSTEM_PAGES } from '@/constants';
import { querySelector } from '@shared/dom';

/**
 * 사용자명 추출 결과
 */
export interface UsernameExtractionResult {
  /** 추출된 사용자명 (null이면 추출 실패) */
  username: string | null;
  /** 추출 방법 */
  method: 'dom' | 'url' | 'meta' | 'fallback';
  /** 신뢰도 (0-1) */
  confidence: number;
}

/**
 * 사용자명 파서 - Phase 4 간소화
 */
export class UsernameParser {
  constructor() {} // public constructor

  /**
   * 페이지에서 사용자명을 추출합니다
   *
   * @param element - 검색 시작점 (기본값: document)
   * @returns 사용자명 추출 결과
   */
  public extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
    const root = element || document;

    // 1. DOM 요소에서 추출 시도
    const domResult = this.extractFromDOM(root);
    if (domResult.username) {
      return domResult;
    }

    // 2. URL에서 추출 시도
    const urlResult = this.extractFromURL();
    if (urlResult.username) {
      return urlResult;
    }

    // 3. 메타데이터에서 추출 시도
    const metaResult = this.extractFromMeta();
    if (metaResult.username) {
      return metaResult;
    }

    // 4. 실패
    return {
      username: null,
      method: 'fallback',
      confidence: 0,
    };
  }

  /**
   * DOM 요소에서 사용자명 추출
   */
  private extractFromDOM(root: HTMLElement | Document): UsernameExtractionResult {
    try {
      const selectors = [
        // 프로필 페이지 사용자명
        '[data-testid="UserName"] [dir="ltr"]',
        '[data-testid="User-Name"] span:not([aria-hidden="true"])',

        // 트윗 작성자 정보
        'article [data-testid="User-Name"] span:not([aria-hidden="true"])',
        'article [role="link"] span[dir="ltr"]',

        // 헤더 영역 사용자명
        'h2[role="heading"] span[dir="ltr"]',

        // 프로필 링크에서 추출
        'a[role="link"][href*="/"][href^="/"]',
      ];

      for (const selector of selectors) {
        const elements = root.querySelectorAll(selector);

        for (const element of elements) {
          const username = this.extractUsernameFromElement(element as HTMLElement);
          if (username) {
            return {
              username,
              method: 'dom',
              confidence: 0.9,
            };
          }
        }
      }
    } catch (error) {
      logger.warn('[UsernameParser] DOM 추출 실패:', error);
    }

    return { username: null, method: 'dom', confidence: 0 };
  }

  /**
   * URL에서 사용자명 추출
   */
  private extractFromURL(): UsernameExtractionResult {
    try {
      const url = window.location.href;
      const patterns = [
        // 프로필 페이지: https://x.com/username
        /\/([a-zA-Z0-9_]+)(?:\/status\/\d+)?(?:\?|$)/,
        // 구 트위터 도메인
        /twitter\.com\/([a-zA-Z0-9_]+)/,
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) {
          const username = match[1];
          // 시스템 페이지 제외
          if (!this.isSystemPage(username)) {
            return {
              username,
              method: 'url',
              confidence: 0.8,
            };
          }
        }
      }
    } catch (error) {
      logger.warn('[UsernameParser] URL 추출 실패:', error);
    }

    return { username: null, method: 'url', confidence: 0 };
  }

  /**
   * 메타데이터에서 사용자명 추출
   */
  private extractFromMeta(): UsernameExtractionResult {
    try {
      const metaSelectors = [
        'meta[property="profile:username"]',
        'meta[property="twitter:creator"]',
        'meta[name="twitter:creator"]',
        'meta[property="og:url"]',
      ];

      for (const selector of metaSelectors) {
        const metaElement = querySelector(selector) as HTMLMetaElement;
        if (metaElement?.content) {
          const username = this.cleanUsername(metaElement.content);
          if (username && !this.isSystemPage(username)) {
            return {
              username,
              method: 'meta',
              confidence: 0.7,
            };
          }
        }
      }
    } catch (error) {
      logger.warn('[UsernameParser] 메타데이터 추출 실패:', error);
    }

    return { username: null, method: 'meta', confidence: 0 };
  }

  /**
   * HTML 요소에서 사용자명 추출
   */
  private extractUsernameFromElement(element: HTMLElement): string | null {
    if (!element) return null;

    try {
      let text = '';

      // 텍스트 추출
      if (element.tagName === 'A' && element.hasAttribute('href')) {
        // 링크에서 href 사용
        const href = element.getAttribute('href') || '';
        const match = href.match(/^\/([a-zA-Z0-9_]+)$/);
        if (match?.[1]) {
          text = match[1];
        }
      } else {
        // 일반 텍스트 추출
        text = element.textContent?.trim() || '';
      }

      const username = this.cleanUsername(text);
      return username && !this.isSystemPage(username) ? username : null;
    } catch (error) {
      logger.warn('[UsernameParser] 요소 추출 실패:', error);
      return null;
    }
  }

  /**
   * 사용자명 정제
   */
  private cleanUsername(text: string): string {
    if (!text) return '';

    // @ 제거, 공백 제거, 소문자로 변환
    let cleaned = text.replace(/^@/, '').trim();

    // URL에서 추출된 경우 경로 제거
    cleaned = cleaned.replace(/^.*\/([^/]+)$/, '$1');

    // 유효한 사용자명 패턴만 허용
    const validPattern = /^[a-zA-Z0-9_]{1,15}$/;
    return validPattern.test(cleaned) ? cleaned : '';
  }

  /**
   * 시스템 페이지 확인
   */
  private isSystemPage(username: string): boolean {
    return (SYSTEM_PAGES as readonly string[]).includes(username.toLowerCase());
  }
}

/**
 * 편의 함수: 사용자명 추출
 */
export function extractUsername(element?: HTMLElement | Document): UsernameExtractionResult {
  const parser = new UsernameParser(); // Phase 4 간소화: 직접 인스턴스화
  return parser.extractUsername(element);
}

/**
 * 편의 함수: 빠른 사용자명 추출 (문자열만 반환)
 */
export function parseUsernameFast(element?: HTMLElement | Document): string | null {
  const parser = new UsernameParser(); // Phase 4 간소화: 직접 인스턴스화
  return parser.extractUsername(element).username;
}
