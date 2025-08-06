/**
 * @fileoverview Browser Service
 * @version 2.0.0 - Core layer migration
 *
 * 브라우저 관련 유틸리티를 관리하는 Core 레이어 서비스
 * DOM 조작, CSS 주입, 브라우저 API 래핑 등 브라우저 기능 제공
 */

import { logger } from '@shared/logging';

/**
 * 브라우저 서비스
 * Core 레이어의 브라우저 API 래핑 서비스
 * AnimationService 기능 통합됨
 * Phase 4 Step 4: 싱글톤에서 직접 클래스로 변환
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
   */
  public downloadFile(url: string, filename?: string): void {
    try {
      const link = document.createElement('a');
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

  // ====================================
  // 브라우저 정보 API
  // ====================================

  /**
   * 사용자 에이전트 정보 반환
   */
  public getUserAgent(): string {
    return navigator.userAgent;
  }
}

// 편의 함수들
// Export utility functions - Phase 4 Step 4: 직접 인스턴스 사용
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
