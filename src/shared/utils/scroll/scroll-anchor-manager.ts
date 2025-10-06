/**
 * @fileoverview Scroll Anchor Manager
 * Epic: GALLERY-UX-ENHANCEMENT Sub-Epic 1
 * TDD Phase: GREEN (구현)
 * Sub-Epic 3 (Production Issue #3): 로깅 강화
 *
 * 목표:
 * - DOM 앵커 기반 스크롤 위치 복원으로 정확도 향상
 * - 동적 콘텐츠 로딩으로 인한 오차 최소화 (±50px 이내)
 * - 앵커 부재 시 픽셀 기반 fallback 동작
 */

import { logger } from '@shared/logging';

/**
 * Scroll 앵커 정보 (Dual Anchor Strategy)
 * Production Issue #3: getBoundingClientRect 기반으로 변경
 */
interface ScrollAnchor {
  /** 앵커 DOM 요소 */
  element: HTMLElement;
  /** 앵커 설정 시점의 offsetTop (getBoundingClientRect + scrollY 기반) */
  offsetTop: number;
  /** 앵커 설정 시각 (타임스탬프) */
  timestamp: number;
  /** Pixel offset fallback (DOM 앵커 실패 시 사용) */
  fallbackScrollTop: number;
}

/**
 * Scroll Anchor Manager
 *
 * 특징:
 * - DOM 요소를 앵커로 사용하여 스크롤 위치 복원
 * - 동적 콘텐츠 로딩 시에도 정확한 위치 복원
 * - 앵커 요소가 DOM에서 제거된 경우 픽셀 기반 fallback
 * - 브라우저 환경 안전 처리 (Node/테스트 환경 호환)
 *
 * 사용 예시:
 * ```typescript
 * // 트윗 클릭 시 앵커 설정
 * const tweetElement = document.querySelector('[data-testid="tweet"]');
 * scrollAnchorManager.setAnchor(tweetElement);
 *
 * // 갤러리 닫을 때 복원
 * scrollAnchorManager.restoreScroll();
 *
 * // 정리
 * scrollAnchorManager.clear();
 * ```
 */
export class ScrollAnchorManager {
  private anchor: ScrollAnchor | null = null;

  /**
   * 뷰포트 크기에 따른 상단 여백 계산
   *
   * Epic GALLERY-UX-REFINEMENT: 뷰포트 반응형 여백
   *
   * @returns 상단 여백 (픽셀)
   * @private
   */
  private calculateTopMargin(): number {
    if (typeof window === 'undefined') {
      return 100; // Node/테스트 환경 fallback
    }

    const viewportHeight = window.innerHeight;

    // 뷰포트 높이 기반 여백 계산
    if (viewportHeight < 600) {
      return 60; // 모바일
    }
    if (viewportHeight < 900) {
      return 80; // 태블릿
    }
    return 100; // 데스크톱
  }

  /**
   * 스크롤 앵커 설정
   * Sub-Epic 3: Production 로깅 추가
   * Production Issue #3: getBoundingClientRect 기반 offsetTop 계산
   *
   * @param element - 앵커로 사용할 DOM 요소 (null이면 앵커 제거)
   */
  setAnchor(element: HTMLElement | null): void {
    // Production 환경 감지
    const isProduction =
      typeof window !== 'undefined' && window.location.hostname.includes('x.com');

    if (!element) {
      logger.debug('[ScrollAnchorManager] 앵커 제거', {
        previousOffsetTop: this.anchor?.offsetTop,
        fallbackScrollTop: typeof window !== 'undefined' ? window.pageYOffset : 0,
      });
      this.anchor = null;
      return;
    }

    // Dual Anchor Strategy: DOM 앵커 + Pixel fallback
    const fallbackScrollTop = typeof window !== 'undefined' ? window.pageYOffset : 0;

    // getBoundingClientRect를 사용하여 정확한 offsetTop 계산
    // element.offsetTop은 SPA 환경에서 0을 반환할 수 있음 (Production Issue #3)
    let offsetTop = 0;
    if (typeof window !== 'undefined') {
      const rect = element.getBoundingClientRect();
      offsetTop = rect.top + window.scrollY;
    }

    // 앵커 정보 저장 (Dual Anchor)
    this.anchor = {
      element,
      offsetTop,
      timestamp: Date.now(),
      fallbackScrollTop,
    };

    logger.info('[ScrollAnchorManager] 앵커 설정 완료', {
      offsetTop,
      fallbackScrollTop,
      elementTag: element.tagName,
      elementClass: element.className,
      environment: isProduction ? 'production' : 'test',
    });
  }

  /**
   * 현재 앵커 요소 조회
   *
   * @returns 앵커 DOM 요소 (없으면 null)
   */
  getAnchor(): HTMLElement | null {
    return this.anchor?.element ?? null;
  }

  /**
   * 앵커 기반 스크롤 위치 복원 (Public API)
   * Production Issue #3: Dual Anchor Strategy 구현
   *
   * 복원 우선순위:
   * 1. DOM 앵커 (getBoundingClientRect 기반)
   * 2. Pixel offset fallback
   * 3. 경고 로그 출력
   *
   * @returns 복원 성공 여부
   */
  restoreScroll(): boolean {
    return this.restoreToAnchor();
  }

  /**
   * 앵커 기반 스크롤 위치 복원 (내부 구현)
   * Sub-Epic 3: Production 로깅 추가
   * Production Issue #3: Dual Anchor Strategy 구현
   *
   * 동작:
   * 1. 앵커 요소가 있고 DOM에 존재하면 DOM 기준 복원
   * 2. DOM 앵커 실패 시 픽셀 기반 fallback
   * 3. 브라우저 환경이 아니면 무시 (Node/테스트 환경 호환)
   *
   * @returns 복원 성공 여부
   */
  private restoreToAnchor(): boolean {
    // Production 환경 감지
    const isProduction =
      typeof window !== 'undefined' && window.location.hostname.includes('x.com');

    // 브라우저 환경 체크
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logger.debug('[ScrollAnchorManager] 브라우저 환경 아님 - 복원 스킵');
      return false;
    }

    // window.scrollTo가 없는 환경 처리
    if (typeof window.scrollTo !== 'function') {
      logger.debug('[ScrollAnchorManager] window.scrollTo 미지원 - 복원 스킵');
      return false;
    }

    // 앵커 없음 - 진단 정보 제공
    if (!this.anchor) {
      logger.warn('[ScrollAnchorManager] 앵커가 설정되지 않음', {
        currentScrollY: window.pageYOffset,
        environment: isProduction ? 'production' : 'test',
      });
      return false;
    }

    // Strategy 1: DOM 앵커 (element가 DOM에 존재)
    if (document.body.contains(this.anchor.element)) {
      // getBoundingClientRect를 사용하여 현재 위치 재계산
      const rect = this.anchor.element.getBoundingClientRect();
      const currentOffsetTop = rect.top + window.scrollY;

      const topMargin = this.calculateTopMargin();
      const targetY = currentOffsetTop - topMargin;
      const clampedY = Math.max(0, targetY);

      logger.info('[ScrollAnchorManager] DOM 앵커 기반 스크롤 복원 실행', {
        anchorOffsetTop: currentOffsetTop,
        topMargin,
        targetY,
        clampedY,
        currentScrollY: window.pageYOffset,
        environment: isProduction ? 'production' : 'test',
      });

      window.scrollTo({
        top: clampedY,
        behavior: 'auto',
      });
      return true;
    }

    // Strategy 2: Pixel offset fallback (DOM 앵커 실패)
    logger.info('[ScrollAnchorManager] DOM 앵커 제거됨 - 픽셀 기반 fallback', {
      hasAnchor: !!this.anchor,
      inDOM: false,
      fallbackScrollTop: this.anchor.fallbackScrollTop,
      environment: isProduction ? 'production' : 'test',
    });

    window.scrollTo(0, this.anchor.fallbackScrollTop);
    return true;
  }

  /**
   * 앵커 상태 초기화
   *
   * 모든 앵커 정보 제거
   * (테스트/정리 용도)
   */
  clear(): void {
    this.anchor = null;
  }

  /**
   * 앵커 데이터 조회 (테스트 목적)
   *
   * @internal
   * @returns 현재 앵커 데이터 (없으면 null)
   */
  _getAnchorData(): ScrollAnchor | null {
    return this.anchor;
  }
}

/**
 * 싱글톤 Scroll Anchor Manager 인스턴스
 * (프로젝트 전역에서 단일 인스턴스 사용)
 */
export const scrollAnchorManager = new ScrollAnchorManager();
