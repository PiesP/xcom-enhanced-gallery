/**
 * @fileoverview Browser Manager
 * @version 1.0.0
 *
 * 브라우저 관련 유틸리티만 관리하는 Shared 레이어 서비스
 * DOM 조작, CSS 주입, 브라우저 API 래핑 등 순수한 브라우저 기능만 제공
 */

import { logger } from '@infrastructure/logging/logger';
import { BaseSingleton } from './patterns/singleton';

/**
 * 메모리 정보 인터페이스
 */
interface MemoryInfo {
  usedJSHeapSize?: number;
  totalJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

/**
 * 브라우저 관리자
 *
 * Shared 레이어에 적절한 순수한 브라우저 API 래핑 기능만 제공:
 * - CSS 주입 (순수 DOM 조작)
 * - 메모리 정보 조회 (브라우저 API 래핑)
 * - 페이지 가시성 상태
 * - DOM 유틸리티
 */
export class BrowserManager extends BaseSingleton {
  private static readonly INSTANCE_NAME = 'BrowserManager';
  private readonly injectedStyles = new Set<string>();

  private constructor() {
    super();
    logger.debug('[BrowserManager] Initialized');
  }

  public static getInstance(): BrowserManager {
    return BaseSingleton.getOrCreateInstance(
      BrowserManager.INSTANCE_NAME,
      () => new BrowserManager()
    );
  }

  public static override resetInstance(): boolean {
    return BaseSingleton.resetInstance(BrowserManager.INSTANCE_NAME);
  }

  /**
   * CSS 주입 (순수 DOM 조작)
   */
  public injectCSS(id: string, css: string): void {
    if (!css) {
      logger.warn('[BrowserManager] Empty CSS provided');
      return;
    }

    // 이미 주입된 스타일은 건너뜀
    if (this.injectedStyles.has(id)) {
      return;
    }

    // 기존 스타일 제거
    const existingStyle = document.getElementById(id);
    if (existingStyle) {
      existingStyle.remove();
    }

    // 새 스타일 주입
    const styleElement = document.createElement('style');
    styleElement.id = id;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    this.injectedStyles.add(id);
    logger.debug(`[BrowserManager] CSS injected: ${id}`);
  }

  /**
   * CSS 제거
   */
  public removeCSS(id: string): void {
    const styleElement = document.getElementById(id);
    if (styleElement) {
      styleElement.remove();
      this.injectedStyles.delete(id);
      logger.debug(`[BrowserManager] CSS removed: ${id}`);
    }
  }

  /**
   * 메모리 정보 조회 (브라우저 API 래핑)
   */
  public getMemoryInfo(): MemoryInfo | null {
    const perfWithMemory = performance as unknown as { memory?: MemoryInfo };
    return perfWithMemory.memory ?? null;
  }

  /**
   * 메모리 사용량 (MB 단위)
   */
  public getMemoryUsageMB(): number | null {
    const memInfo = this.getMemoryInfo();
    if (!memInfo?.usedJSHeapSize) {
      return null;
    }
    return Math.round(memInfo.usedJSHeapSize / 1024 / 1024);
  }

  /**
   * 페이지 가시성 상태
   */
  public isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * 페이지 포커스 상태
   */
  public isPageFocused(): boolean {
    return document.hasFocus();
  }

  /**
   * DOM 준비 상태 확인
   */
  public isDOMReady(): boolean {
    return document.readyState !== 'loading' && document.body != null;
  }

  /**
   * 뷰포트 크기 조회
   */
  public getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  /**
   * 스크롤 위치 조회
   */
  public getScrollPosition(): { x: number; y: number } {
    return {
      x: window.scrollX || window.pageXOffset,
      y: window.scrollY || window.pageYOffset,
    };
  }

  /**
   * 사용자 에이전트 정보
   */
  public getUserAgent(): string {
    return navigator.userAgent;
  }

  /**
   * 브라우저 타입 감지
   */
  public getBrowserType(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' {
    const ua = this.getUserAgent().toLowerCase();

    if (ua.includes('chrome') && !ua.includes('edge')) {
      return 'chrome';
    }
    if (ua.includes('firefox')) {
      return 'firefox';
    }
    if (ua.includes('safari') && !ua.includes('chrome')) {
      return 'safari';
    }
    if (ua.includes('edge')) {
      return 'edge';
    }
    return 'other';
  }

  /**
   * 주입된 스타일 목록
   */
  public getInjectedStyles(): string[] {
    return Array.from(this.injectedStyles);
  }

  /**
   * 모든 주입된 스타일 제거
   */
  public clearAllStyles(): void {
    this.injectedStyles.forEach(id => {
      this.removeCSS(id);
    });
    this.injectedStyles.clear();
    logger.debug('[BrowserManager] All injected styles cleared');
  }

  /**
   * 페이지 변경 감지 리스너 추가
   */
  public onPageChange(callback: () => void): () => void {
    let currentUrl = window.location.href;

    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        callback();
      }
    });

    // DOM 변경 감지
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    // 정리 함수 반환
    return () => {
      observer.disconnect();
    };
  }

  /**
   * 진단 정보
   */
  public getDiagnostics(): {
    memoryInfo: MemoryInfo | null;
    memoryUsageMB: number | null;
    isPageVisible: boolean;
    isPageFocused: boolean;
    isDOMReady: boolean;
    viewportSize: { width: number; height: number };
    scrollPosition: { x: number; y: number };
    browserType: string;
    injectedStylesCount: number;
  } {
    return {
      memoryInfo: this.getMemoryInfo(),
      memoryUsageMB: this.getMemoryUsageMB(),
      isPageVisible: this.isPageVisible(),
      isPageFocused: this.isPageFocused(),
      isDOMReady: this.isDOMReady(),
      viewportSize: this.getViewportSize(),
      scrollPosition: this.getScrollPosition(),
      browserType: this.getBrowserType(),
      injectedStylesCount: this.injectedStyles.size,
    };
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.clearAllStyles();
    logger.debug('[BrowserManager] Cleanup complete');
  }
}

/**
 * 편의 함수들
 */
export const browserManager = {
  /**
   * 인스턴스 반환
   */
  getInstance: () => BrowserManager.getInstance(),

  /**
   * CSS 주입
   */
  injectCSS: (id: string, css: string) => BrowserManager.getInstance().injectCSS(id, css),

  /**
   * CSS 제거
   */
  removeCSS: (id: string) => BrowserManager.getInstance().removeCSS(id),

  /**
   * 메모리 사용량 조회 (MB)
   */
  getMemoryUsage: () => BrowserManager.getInstance().getMemoryUsageMB(),

  /**
   * 페이지 상태 확인
   */
  isPageVisible: () => BrowserManager.getInstance().isPageVisible(),

  /**
   * DOM 준비 상태
   */
  isDOMReady: () => BrowserManager.getInstance().isDOMReady(),

  /**
   * 진단 정보
   */
  diagnostics: () => BrowserManager.getInstance().getDiagnostics(),
};
