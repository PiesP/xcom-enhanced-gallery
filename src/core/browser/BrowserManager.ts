/**
 * @fileoverview Browser Manager
 * @version 2.0.0 - Core layer migration
 *
 * 브라우저 관련 유틸리티를 관리하는 Core 레이어 서비스
 * DOM 조작, CSS 주입, 브라우저 API 래핑 등 브라우저 기능 제공
 */

import { logger } from '@core/logging/logger';

/**
 * 브라우저 관리자
 * Core 레이어의 브라우저 API 래핑 서비스
 */
export class BrowserManager {
  private static instance: BrowserManager | null = null;
  private readonly injectedStyles = new Set<string>();

  private constructor() {
    logger.debug('[BrowserManager] Initialized');
  }

  public static getInstance(): BrowserManager {
    BrowserManager.instance ??= new BrowserManager();
    return BrowserManager.instance;
  }

  public static resetInstance(): void {
    if (BrowserManager.instance) {
      BrowserManager.instance.cleanup();
      BrowserManager.instance = null;
    }
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
    logger.debug(`[BrowserManager] CSS injected: ${id}`);
  }

  /**
   * CSS 제거
   */
  public removeCSS(id: string): void {
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserManager] CSS removed: ${id}`);
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

      logger.debug('[BrowserManager] File download initiated', { url, filename });
    } catch (error) {
      logger.error('[BrowserManager] File download failed', error);
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
    logger.debug('[BrowserManager] Cleanup complete');
  }
}

// 편의 함수들
export const browserUtils = {
  injectCSS: (id: string, css: string) => BrowserManager.getInstance().injectCSS(id, css),
  removeCSS: (id: string) => BrowserManager.getInstance().removeCSS(id),
  downloadFile: (url: string, filename?: string) =>
    BrowserManager.getInstance().downloadFile(url, filename),
  isPageVisible: () => BrowserManager.getInstance().isPageVisible(),
  isDOMReady: () => BrowserManager.getInstance().isDOMReady(),
  getDiagnostics: () => BrowserManager.getInstance().getDiagnostics(),
  cleanup: () => BrowserManager.getInstance().cleanup(),
};
