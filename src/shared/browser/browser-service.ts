/**
 * @fileoverview Browser Service (Infrastructure Layer)
 * @version 2.2.0 - Phase 223: browser-utils 통합, 검증 로직 추가
 *
 * DOM 조작, CSS 주입, 파일 다운로드, 브라우저 상태 관리를 담당하는 핵심 서비스.
 * Phase 194의 browser-utils.ts와 browser-service.ts 중복 제거 완료.
 *
 * @responsibility
 * - CSS 주입/제거 (안전 검증 포함)
 * - 파일 다운로드 (기본 구현, Userscript 사용 권장)
 * - 페이지 가시성 및 DOM 준비 상태 확인
 * - 진단 정보 조회
 * - 리소스 정리
 *
 * @note AnimationService (shared/services/animation-service.ts)와 역할 분담:
 * - AnimationService: 복잡한 애니메이션 및 재사용 가능한 애니메이션 제공
 * - BrowserService: 기본 DOM 및 CSS 관리
 *
 * @example
 * ```typescript
 * import { browserAPI } from '@shared/browser';
 *
 * // CSS 주입
 * browserAPI.injectCSS('my-styles', '.button { color: blue; }');
 *
 * // 상태 확인
 * if (browserAPI.isDOMReady()) {
 *   console.log('DOM is ready');
 * }
 *
 * // 정리
 * browserAPI.cleanup();
 * ```
 */

import { logger } from '@shared/logging';

/**
 * 브라우저 서비스
 * DOM 조작, CSS 관리, 브라우저 상태 확인을 수행하는 Infrastructure 서비스.
 */
export class BrowserService {
  private readonly injectedStyles = new Set<string>();

  constructor() {
    logger.debug('[BrowserService] Initialized');
  }

  /**
   * CSS 주입
   * @param id - 스타일 요소 ID (중복 방지용)
   * @param css - 주입할 CSS 텍스트
   * @throws 경고 로그 출력 (empty CSS)
   * @note Phase 223: 빈 CSS 유효성 검사 추가
   */
  public injectCSS(id: string, css: string): void {
    // Phase 223: Empty CSS 검증 (browser-utils 로직 통합)
    if (!css?.trim().length) {
      logger.warn('[BrowserService] Empty CSS provided', { id });
      return;
    }

    // 기존 스타일 제거
    this.removeCSS(id);

    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';
    style.textContent = css;

    // Phase 223: document.head 폴백 추가 (browser-utils 안정성)
    const target = document.head || document.documentElement;
    target.appendChild(style);

    this.injectedStyles.add(id);
    logger.debug(`[BrowserService] CSS injected: ${id}`);
  }

  /**
   * CSS 제거
   * @param id - 제거할 스타일 요소 ID
   * @note Phase 223: STYLE 태그 타입 검증 추가
   */
  public removeCSS(id: string): void {
    const element = document.getElementById(id);
    // Phase 223: STYLE 태그 검증 (browser-utils 안정성)
    if (element?.tagName === 'STYLE') {
      element.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserService] CSS removed: ${id}`);
    }
  }

  /**
   * 페이지 가시성 확인
   * @returns true if page is visible
   */
  public isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * DOM 준비 상태 확인
   * @returns true if DOM is complete or interactive
   * @note Phase 223: 'interactive' 상태도 추가 (browser-utils 호환성)
   */
  public isDOMReady(): boolean {
    return document.readyState === 'complete' || document.readyState === 'interactive';
  }

  /**
   * 진단 정보 조회
   * @note Phase 223: injectedStyles 배열 추가 (browser-utils 호환성)
   * @returns 주입된 스타일, 페이지 가시성, DOM 준비 상태 정보
   */
  public getDiagnostics(): {
    injectedStylesCount: number;
    injectedStyles: string[];
    pageVisible: boolean;
    domReady: boolean;
  } {
    return {
      injectedStylesCount: this.injectedStyles.size,
      injectedStyles: Array.from(this.injectedStyles),
      pageVisible: this.isPageVisible(),
      domReady: this.isDOMReady(),
    };
  }

  /**
   * 모든 관리 중인 리소스 정리
   * @note Phase 223: 모든 주입된 스타일 제거 (browser-utils 호환성)
   */
  public cleanup(): void {
    // Phase 223: 모든 주입된 스타일 명시적 제거
    for (const id of this.injectedStyles) {
      this.removeCSS(id);
    }
    this.injectedStyles.clear();
    logger.debug('[BrowserService] Cleanup complete');
  }
}

// 편의 함수들
// Export utility functions - Phase 4 Step 4: 직접 인스턴스 사용
// Phase 194: AnimationService와 역할 분담으로 animation 관련 함수 제거
const defaultBrowserService = new BrowserService();

export const browserAPI = {
  injectCSS: (id: string, css: string) => defaultBrowserService.injectCSS(id, css),
  removeCSS: (id: string) => defaultBrowserService.removeCSS(id),
  isPageVisible: () => defaultBrowserService.isPageVisible(),
  isDOMReady: () => defaultBrowserService.isDOMReady(),
  getDiagnostics: () => defaultBrowserService.getDiagnostics(),
  cleanup: () => defaultBrowserService.cleanup(),
};
