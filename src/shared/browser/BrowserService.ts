/**
 * @fileoverview Browser Service
 * @version 2.0.0 - Core layer migration
 *
 * 브라우저 관련 유틸리티를 관리하는 Core 레이어 서비스
 * DOM 조작, CSS 주입, 브라우저 API 래핑 등 브라우저 기능 제공
 */

import { logger } from '@shared/logging/logger';

/**
 * 브라우저 서비스
 * Core 레이어의 브라우저 API 래핑 서비스
 * AnimationService 기능 통합됨
 * Phase 4 Step 4: 싱글톤에서 직접 클래스로 변환
 */
export class BrowserService {
  private readonly injectedStyles = new Set<string>();

  // AnimationService 통합 (CSS 애니메이션 기본 스타일)
  private animationStylesInjected = false;

  constructor() {
    logger.debug('[BrowserService] Initialized');
    this.ensureAnimationStylesInjected();
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

  // ====================================
  // Animation API (통합됨)
  // ====================================

  /**
   * 기본 애니메이션 스타일 주입
   */
  private ensureAnimationStylesInjected(): void {
    if (this.animationStylesInjected) return;

    const styles = `
      .xeg-fade-in {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      .xeg-fade-in.active {
        opacity: 1;
      }
      .xeg-fade-out {
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }
      .xeg-fade-out.active {
        opacity: 0;
      }
    `;

    this.injectCSS('xeg-animation-base', styles);
    this.animationStylesInjected = true;
  }

  /**
   * 요소에 페이드 인 애니메이션 적용
   */
  public fadeIn(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      element.style.opacity = '0';

      requestAnimationFrame(() => {
        element.style.opacity = '1';
        setTimeout(resolve, duration);
      });
    });
  }

  /**
   * 요소에 페이드 아웃 애니메이션 적용
   */
  public fadeOut(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      element.style.opacity = '1';

      requestAnimationFrame(() => {
        element.style.opacity = '0';
        setTimeout(resolve, duration);
      });
    });
  }

  /**
   * CSS 클래스 기반 애니메이션
   */
  public animate(element: HTMLElement, className: string, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.classList.add(className);
      setTimeout(() => {
        element.classList.remove(className);
        resolve();
      }, duration);
    });
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

  // Animation utilities (통합됨)
  fadeIn: (element: HTMLElement, duration?: number) =>
    defaultBrowserService.fadeIn(element, duration),
  fadeOut: (element: HTMLElement, duration?: number) =>
    defaultBrowserService.fadeOut(element, duration),
  animate: (element: HTMLElement, className: string, duration?: number) =>
    defaultBrowserService.animate(element, className, duration),
};
