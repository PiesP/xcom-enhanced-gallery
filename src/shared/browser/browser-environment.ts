/**
 * @fileoverview Browser 환경 체크 유틸리티 - 환경 감지 및 안전한 글로벌 접근 전용
 * Phase 1.3 GREEN: 환경 체크 기능을 별도 모듈로 분리
 */

import { logger } from '@shared/logging';

/**
 * 브라우저 환경인지 확인
 * @returns 브라우저 환경 여부
 */
export const isBrowserEnvironment = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  } catch {
    return false;
  }
};

/**
 * 안전한 window 객체 접근
 * @returns window 객체 또는 undefined
 */
export const safeWindow = (): Window | undefined => {
  try {
    return isBrowserEnvironment() ? window : undefined;
  } catch (error) {
    logger.debug('Failed to access window object', {
      error: error instanceof Error ? error.message : String(error),
    });
    return undefined;
  }
};

/**
 * 확장 프로그램 환경인지 확인 (Chrome extension, Firefox addon 등)
 * @returns 확장 프로그램 환경 여부
 */
export const isExtensionEnvironment = (): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    const win = safeWindow() as Window & {
      chrome?: { runtime?: unknown };
      browser?: { runtime?: unknown };
      safari?: { extension?: unknown };
    };
    if (!win) return false;

    // Chrome/Edge extension
    const hasChrome =
      typeof win.chrome !== 'undefined' && typeof win.chrome.runtime !== 'undefined';

    // Firefox addon
    const hasFirefox =
      typeof win.browser !== 'undefined' && typeof win.browser.runtime !== 'undefined';

    // Safari extension
    const hasSafari =
      typeof win.safari !== 'undefined' && typeof win.safari.extension !== 'undefined';

    return hasChrome || hasFirefox || hasSafari;
  } catch (error) {
    logger.debug('Failed to check extension environment', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * 현재 스크롤 위치 저장
 * @param key - 저장할 키 이름 (기본값: 'scrollPosition')
 * @returns 저장 성공 여부
 */
export const saveScrollPosition = (key: string = 'scrollPosition'): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    const win = safeWindow();
    if (!win) return false;

    const scrollData = {
      x: win.scrollX || win.pageXOffset,
      y: win.scrollY || win.pageYOffset,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(scrollData));

    logger.debug('Scroll position saved', { key, scrollData });

    return true;
  } catch (error) {
    logger.error('Failed to save scroll position', {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    return false;
  }
};

/**
 * 저장된 스크롤 위치 복원
 * @param key - 복원할 키 이름 (기본값: 'scrollPosition')
 * @param smooth - 부드러운 스크롤 여부 (기본값: false)
 * @returns 복원 성공 여부
 */
export const restoreScrollPosition = (
  key: string = 'scrollPosition',
  smooth: boolean = false
): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    const win = safeWindow();
    if (!win) return false;

    const savedData = sessionStorage.getItem(key);
    if (!savedData) {
      logger.debug('No saved scroll position found', { key });
      return false;
    }

    const scrollData = JSON.parse(savedData) as {
      x: number;
      y: number;
      timestamp: number;
    };

    if (smooth) {
      win.scrollTo({
        left: scrollData.x,
        top: scrollData.y,
        behavior: 'smooth',
      });
    } else {
      win.scrollTo(scrollData.x, scrollData.y);
    }

    logger.debug('Scroll position restored', { key, scrollData });

    return true;
  } catch (error) {
    logger.error('Failed to restore scroll position', {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    return false;
  }
};

/**
 * 저장된 스크롤 위치 삭제
 * @param key - 삭제할 키 이름 (기본값: 'scrollPosition')
 * @returns 삭제 성공 여부
 */
export const clearScrollPosition = (key: string = 'scrollPosition'): boolean => {
  if (!isBrowserEnvironment()) {
    return false;
  }

  try {
    sessionStorage.removeItem(key);
    logger.debug('Scroll position cleared', { key });
    return true;
  } catch (error) {
    logger.error('Failed to clear scroll position', {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    return false;
  }
};

/**
 * 현재 페이지의 기본 정보 수집
 * @returns 페이지 정보 객체
 */
export const getPageInfo = () => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const win = safeWindow();
    if (!win) return null;

    return {
      url: win.location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      viewport: {
        width: win.innerWidth,
        height: win.innerHeight,
      },
      scroll: {
        x: win.scrollX || win.pageXOffset,
        y: win.scrollY || win.pageYOffset,
      },
      isExtension: isExtensionEnvironment(),
    };
  } catch (error) {
    logger.error('Failed to get page info', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
