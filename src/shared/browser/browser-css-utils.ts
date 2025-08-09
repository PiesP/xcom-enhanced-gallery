/**
 * @fileoverview Browser CSS 유틸리티 - CSS 스타일 주입 및 관리 전용
 * Phase 1.3 GREEN: CSS 기능을 별도 모듈로 분리
 */

import { logger } from '@shared/logging';

/**
 * Browser CSS 관리 유틸리티 클래스
 * CSS 스타일 주입, 제거 및 추적 기능 제공
 */
export class BrowserCSSUtils {
  private static readonly injectedStyles: Set<string> = new Set();

  /**
   * CSS 스타일을 페이지에 주입
   * @param css - 주입할 CSS 문자열
   * @param styleId - 스타일 요소의 고유 ID (선택사항)
   * @returns 생성된 style 요소
   */
  static injectCSS(css: string, styleId?: string): HTMLStyleElement {
    try {
      const style = document.createElement('style');
      style.textContent = css;

      if (styleId) {
        style.id = styleId;
        this.injectedStyles.add(styleId);
      }

      document.head.appendChild(style);

      logger.debug('CSS injected successfully', {
        styleId,
        cssLength: css.length,
        totalInjected: this.injectedStyles.size,
      });

      return style;
    } catch (error) {
      logger.error('Failed to inject CSS', {
        error: error instanceof Error ? error.message : String(error),
        styleId,
        cssLength: css?.length,
      });
      throw error;
    }
  }

  /**
   * 주입된 CSS 스타일 제거
   * @param styleIdOrElement - 제거할 스타일 ID 또는 style 요소
   * @returns 제거 성공 여부
   */
  static removeCSS(styleIdOrElement: string | HTMLStyleElement): boolean {
    try {
      let element: HTMLStyleElement | null = null;

      if (typeof styleIdOrElement === 'string') {
        element = document.getElementById(styleIdOrElement) as HTMLStyleElement;
        this.injectedStyles.delete(styleIdOrElement);
      } else {
        element = styleIdOrElement;
        if (element.id) {
          this.injectedStyles.delete(element.id);
        }
      }

      if (element?.parentNode) {
        element.parentNode.removeChild(element);

        logger.debug('CSS removed successfully', {
          styleId: typeof styleIdOrElement === 'string' ? styleIdOrElement : element.id,
          remainingStyles: this.injectedStyles.size,
        });

        return true;
      }

      logger.warn('CSS element not found for removal', {
        target: typeof styleIdOrElement === 'string' ? styleIdOrElement : 'HTMLStyleElement',
      });

      return false;
    } catch (error) {
      logger.error('Failed to remove CSS', {
        error: error instanceof Error ? error.message : String(error),
        target: typeof styleIdOrElement === 'string' ? styleIdOrElement : 'HTMLStyleElement',
      });

      return false;
    }
  }

  /**
   * 모든 주입된 CSS 스타일 제거
   * @returns 제거된 스타일 개수
   */
  static removeAllInjectedCSS(): number {
    let removedCount = 0;

    try {
      this.injectedStyles.forEach(styleId => {
        if (this.removeCSS(styleId)) {
          removedCount++;
        }
      });

      this.injectedStyles.clear();

      logger.debug('All injected CSS removed', { removedCount });

      return removedCount;
    } catch (error) {
      logger.error('Failed to remove all CSS', {
        error: error instanceof Error ? error.message : String(error),
        removedCount,
      });

      return removedCount;
    }
  }

  /**
   * 현재 주입된 CSS 스타일 목록 반환
   * @returns 주입된 스타일 ID 배열
   */
  static getInjectedStyles(): string[] {
    return Array.from(this.injectedStyles);
  }

  /**
   * 특정 스타일이 주입되어 있는지 확인
   * @param styleId - 확인할 스타일 ID
   * @returns 주입 여부
   */
  static hasInjectedStyle(styleId: string): boolean {
    return this.injectedStyles.has(styleId);
  }
}

// 기존 BrowserUtils 클래스와 호환성을 위한 alias
export const BrowserUtils = BrowserCSSUtils;
