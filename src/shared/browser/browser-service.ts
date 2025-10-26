/**
 * @fileoverview Browser Service (Core Layer)
 * @version 2.1.0 - Phase 194: browser-utils 통합, 구조 최적화
 *
 * DOM 조작, CSS 주입, 다운로드, 애니메이션 관리를 담당하는 통합 서비스.
 * 이전의 browser-utils.ts와 browser-service.ts를 통합하여 단일 책임 원칙 준수.
 *
 * @note AnimationService (shared/services/animation-service.ts)와 역할 분담:
 * - AnimationService: 복잡한 애니메이션 및 재사용 가능한 애니메이션 제공
 * - BrowserService: 기본적인 DOM 및 CSS 관리
 */

import { logger } from '@shared/logging';

/**
 * 브라우저 서비스
 * DOM 조작, CSS 주입, 다운로드, 브라우저 상태 확인 등을 담당하는 통합 서비스.
 *
 * @responsibility
 * - CSS 주입/제거 관리
 * - 파일 다운로드 (기본 구현, Userscript 사용 권장)
 * - 페이지 가시성 및 DOM 준비 상태 확인
 * - 진단 정보 제공
 *
 * @note Phase 194: browser-utils.ts의 기능을 통합하여 단일 서비스로 통일
 */
export class BrowserService {
  private readonly injectedStyles = new Set<string>();

  constructor() {
    logger.debug('[BrowserService] Initialized');
  }

  /**
   * CSS 주입
   */
  public injectCSS(id: string, css: string): void {
    // 기존 스타일이 있으면 제거
    this.removeCSS(id);

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);

    this.injectedStyles.add(id);
    logger.debug(`[BrowserService] CSS injected: ${id}`);
  }

  /**
   * CSS 제거
   */
  public removeCSS(id: string): void {
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserService] CSS removed: ${id}`);
    }
  }

  /**
   * 파일 다운로드
   * @deprecated Use getUserscript().download() instead for userscript compatibility
   * This is a fallback for non-userscript environments
   */
  public downloadFile(url: string, filename?: string): void {
    try {
      const link = document.createElement('a');
      // codeql[js/unsafe-download-pattern] - Legacy fallback, prefer getUserscript().download()
      link.href = url;
      if (filename) {
        link.download = filename;
      }
      link.target = '_blank';

      // 임시로 DOM에 추가하여 클릭 이벤트 트리거
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.debug('[BrowserService] File download initiated', { url, filename });
    } catch (error) {
      logger.error('[BrowserService] File download failed', error);
      throw error;
    }
  }

  /**
   * 페이지 가시성 확인
   */
  public isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * DOM 준비 상태 확인
   */
  public isDOMReady(): boolean {
    return document.readyState === 'complete';
  }

  /**
   * 진단 정보 조회
   * @deprecated v1.1.0 - UnifiedServiceDiagnostics.getBrowserDiagnostics()를 사용하세요
   */
  public getDiagnostics(): {
    injectedStylesCount: number;
    isPageVisible: boolean;
    isDOMReady: boolean;
  } {
    return {
      injectedStylesCount: this.injectedStyles.size,
      isPageVisible: this.isPageVisible(),
      isDOMReady: this.isDOMReady(),
    };
  }

  /**
   * 모든 관리 중인 리소스 정리
   */
  public cleanup(): void {
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
  downloadFile: (url: string, filename: string) =>
    defaultBrowserService.downloadFile(url, filename),
  isPageVisible: () => defaultBrowserService.isPageVisible(),
  isDOMReady: () => defaultBrowserService.isDOMReady(),
  getDiagnostics: () => defaultBrowserService.getDiagnostics(),
  cleanup: () => defaultBrowserService.cleanup(),
};
