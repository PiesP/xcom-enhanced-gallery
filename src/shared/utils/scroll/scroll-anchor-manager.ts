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
 * Scroll 앵커 정보
 */
interface ScrollAnchor {
  /** 앵커 DOM 요소 */
  element: HTMLElement;
  /** 앵커 설정 시점의 offsetTop (참조용) */
  offsetTop: number;
  /** 앵커 설정 시각 (타임스탬프) */
  timestamp: number;
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
 * scrollAnchorManager.restoreToAnchor();
 *
 * // 정리
 * scrollAnchorManager.clear();
 * ```
 */
export class ScrollAnchorManager {
  private anchor: ScrollAnchor | null = null;
  private fallbackScrollTop: number = 0;

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
      this.fallbackScrollTop = typeof window !== 'undefined' ? window.pageYOffset : 0;
      return;
    }

    // 앵커 정보 저장
    this.anchor = {
      element,
      offsetTop: element.offsetTop,
      timestamp: Date.now(),
    };

    // Fallback 위치도 저장 (앵커 요소 제거 시 사용)
    if (typeof window !== 'undefined') {
      this.fallbackScrollTop = window.pageYOffset;
    }

    logger.info('[ScrollAnchorManager] 앵커 설정 완료', {
      offsetTop: element.offsetTop,
      fallbackScrollTop: this.fallbackScrollTop,
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
   * 앵커 기반 스크롤 위치 복원
   * Sub-Epic 3: Production 로깅 추가
   *
   * 동작:
   * 1. 앵커 요소가 있고 DOM에 존재하면 앵커 기준 복원
   * 2. 앵커가 없거나 DOM에서 제거되었으면 픽셀 기반 fallback
   * 3. 브라우저 환경이 아니면 무시 (Node/테스트 환경 호환)
   */
  restoreToAnchor(): void {
    // Production 환경 감지
    const isProduction =
      typeof window !== 'undefined' && window.location.hostname.includes('x.com');

    // 브라우저 환경 체크
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logger.debug('[ScrollAnchorManager] 브라우저 환경 아님 - 복원 스킵');
      return;
    }

    // window.scrollTo가 없는 환경 처리
    if (typeof window.scrollTo !== 'function') {
      logger.debug('[ScrollAnchorManager] window.scrollTo 미지원 - 복원 스킵');
      return;
    }

    // 앵커가 없거나 DOM에서 제거된 경우 fallback
    if (!this.anchor || !document.body.contains(this.anchor.element)) {
      logger.info('[ScrollAnchorManager] 앵커 없음 또는 제거됨 - 픽셀 기반 fallback', {
        hasAnchor: !!this.anchor,
        inDOM: this.anchor ? document.body.contains(this.anchor.element) : false,
        fallbackScrollTop: this.fallbackScrollTop,
        environment: isProduction ? 'production' : 'test',
      });
      this.restoreToPixelPosition();
      return;
    }

    // 앵커 요소를 기준으로 스크롤 위치 계산
    // 상단 여백을 뷰포트 크기에 따라 동적으로 계산
    const topMargin = this.calculateTopMargin();
    const targetY = this.anchor.element.offsetTop - topMargin;

    // 음수 방지 (상단 경계)
    const clampedY = Math.max(0, targetY);

    logger.info('[ScrollAnchorManager] 앵커 기반 스크롤 복원 실행', {
      anchorOffsetTop: this.anchor.element.offsetTop,
      topMargin,
      targetY,
      clampedY,
      currentScrollY: window.pageYOffset,
      environment: isProduction ? 'production' : 'test',
    });

    // 스크롤 복원 (즉시 이동, smooth는 UX 개선 시 옵션)
    window.scrollTo({
      top: clampedY,
      behavior: 'auto',
    });
  }

  /**
   * 픽셀 기반 스크롤 위치 복원 (Fallback)
   * Sub-Epic 3: 로깅 추가
   *
   * @private
   */
  private restoreToPixelPosition(): void {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      logger.info('[ScrollAnchorManager] 픽셀 기반 스크롤 복원 (Fallback)', {
        fallbackScrollTop: this.fallbackScrollTop,
        currentScrollY: window.pageYOffset,
      });
      window.scrollTo(0, this.fallbackScrollTop);
    } else {
      logger.debug('[ScrollAnchorManager] 브라우저 환경 아님 - 픽셀 복원 스킵');
    }
  }

  /**
   * 앵커 상태 초기화
   *
   * 모든 앵커 정보 및 fallback 위치 제거
   * (테스트/정리 용도)
   */
  clear(): void {
    this.anchor = null;
    this.fallbackScrollTop = 0;
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
