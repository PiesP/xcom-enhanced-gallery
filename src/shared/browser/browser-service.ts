/**
 * @fileoverview Browser 서비스 - CSS와 환경 기능을 통합하는 고수준 서비스
 * Phase 1.3 GREEN: 통합된 브라우저 서비스 인터페이스 제공
 * @version 3.0.0 - Browser 유틸리티 통합 완료
 */

import { BrowserCSSUtils } from './browser-css-utils';
import {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
} from './browser-environment';
import { logger } from '@shared/logging';

/**
 * 통합된 브라우저 서비스 클래스
 * CSS 관리와 환경 체크 기능을 하나의 인터페이스로 제공
 */
export class BrowserService {
  // CSS 관련 기능 위임
  static readonly css = BrowserCSSUtils;

  // 환경 체크 기능들
  static readonly environment = {
    isBrowser: isBrowserEnvironment,
    getWindow: safeWindow,
    isExtension: isExtensionEnvironment,
    getPageInfo,
  } as const;

  // 스크롤 관련 기능들
  static readonly scroll = {
    save: saveScrollPosition,
    restore: restoreScrollPosition,
    clear: clearScrollPosition,
  } as const;

  /**
   * 초기화 및 환경 검사
   * @returns 브라우저 서비스 사용 가능 여부
   */
  static initialize(): boolean {
    try {
      if (!isBrowserEnvironment()) {
        logger.warn('Browser service initialized in non-browser environment');
        return false;
      }

      logger.debug('Browser service initialized successfully', {
        isExtension: isExtensionEnvironment(),
        pageInfo: getPageInfo(),
      });

      return true;
    } catch (error) {
      logger.error('Failed to initialize browser service', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 서비스 정리 및 리소스 해제
   * @returns 정리 완료 여부
   */
  static cleanup(): boolean {
    try {
      // 모든 주입된 CSS 제거
      const removedStyles = BrowserCSSUtils.removeAllInjectedCSS();

      // 저장된 스크롤 위치 정리
      clearScrollPosition();

      logger.debug('Browser service cleanup completed', {
        removedStyles,
      });

      return true;
    } catch (error) {
      logger.error('Failed to cleanup browser service', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * 서비스 상태 정보 반환
   * @returns 서비스 상태 객체
   */
  static getStatus() {
    try {
      return {
        initialized: isBrowserEnvironment(),
        environment: {
          isBrowser: isBrowserEnvironment(),
          isExtension: isExtensionEnvironment(),
          hasWindow: safeWindow() !== undefined,
        },
        css: {
          injectedStyles: BrowserCSSUtils.getInjectedStyles(),
          styleCount: BrowserCSSUtils.getInjectedStyles().length,
        },
        page: getPageInfo(),
      };
    } catch (error) {
      logger.error('Failed to get browser service status', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

// 기존 코드와의 호환성을 위한 re-exports
export { BrowserCSSUtils } from './browser-css-utils';
export {
  isBrowserEnvironment,
  safeWindow,
  isExtensionEnvironment,
  saveScrollPosition,
  restoreScrollPosition,
  clearScrollPosition,
  getPageInfo,
} from './browser-environment';
