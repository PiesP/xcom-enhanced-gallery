/**
 * @fileoverview Browser Utils
 * @version 2.0.0 - Infrastructure layer
 *
 * 브라우저 관련 유틸리티를 제공하는 Infrastructure 레이어 서비스
 * DOM 조작, CSS 주입, 브라우저 API 래핑 등 브라우저 기능 제공
 */

import { logger } from '../logging/logger';

/**
 * 브라우저 유틸리티
 * Infrastructure 레이어의 브라우저 API 래핑 서비스
 * Phase 4 Step 4: 싱글톤에서 직접 클래스로 변환
 */
export class BrowserUtils {
  private readonly injectedStyles = new Set<string>();

  constructor() {
    logger.debug('[BrowserUtils] Initialized');
  }

  /**
   * CSS 주입
   */
  public injectCSS(id: string, css: string): void {
    if (css?.trim().length === 0) {
      logger.warn('[BrowserUtils] Empty CSS provided');
      return;
    }

    // 기존 스타일 제거
    this.removeCSS(id);

    const style = document.createElement('style');
    style.id = id;
    style.type = 'text/css';
    style.textContent = css;

    const target = document.head || document.documentElement;
    target.appendChild(style);

    this.injectedStyles.add(id);
    logger.debug(`[BrowserUtils] CSS injected: ${id}`);
  }

  /**
   * CSS 제거
   */
  public removeCSS(id: string): void {
    const element = document.getElementById(id);
    if (element?.tagName === 'STYLE') {
      element.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserUtils] CSS removed: ${id}`);
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
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.debug(`[BrowserUtils] Download triggered: ${filename || url}`);
    } catch (error) {
      logger.error(`[BrowserUtils] Download failed: ${filename || url}`, error);
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
    return document.readyState === 'complete' || document.readyState === 'interactive';
  }

  /**
   * 진단 정보
   */
  public getDiagnostics(): {
    injectedStyles: string[];
    pageVisible: boolean;
    domReady: boolean;
  } {
    return {
      injectedStyles: Array.from(this.injectedStyles),
      pageVisible: this.isPageVisible(),
      domReady: this.isDOMReady(),
    };
  }

  /**
   * 정리
   */
  public cleanup(): void {
    // 주입된 모든 스타일 제거
    for (const id of this.injectedStyles) {
      this.removeCSS(id);
    }
    this.injectedStyles.clear();

    logger.debug('[BrowserUtils] Cleanup complete');
  }
}

// 편의 함수 export - Phase 4 Step 4: 직접 인스턴스 사용
const defaultBrowserUtils = new BrowserUtils();

export const browserUtils = {
  injectCSS: (id: string, css: string) => defaultBrowserUtils.injectCSS(id, css),
  removeCSS: (id: string) => defaultBrowserUtils.removeCSS(id),
  downloadFile: (url: string, filename?: string) => defaultBrowserUtils.downloadFile(url, filename),
  isPageVisible: () => defaultBrowserUtils.isPageVisible(),
  isDOMReady: () => defaultBrowserUtils.isDOMReady(),
  diagnostics: () => defaultBrowserUtils.getDiagnostics(),
} as const;
