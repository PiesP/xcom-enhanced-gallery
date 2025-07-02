/**
 * @fileoverview 브라우저 전역 객체에 대한 안전한 접근 유틸리티
 * @version 1.0.0
 *
 * Window, Location, Navigator 등의 브라우저 전역 객체에 대한 타입 안전한 접근을 제공합니다.
 * 서버사이드 렌더링이나 테스트 환경에서도 안전하게 동작합니다.
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 브라우저 환경 체크
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 안전한 Window 접근
 */
export function safeWindow(): Window | null {
  if (!isBrowserEnvironment()) {
    logger.debug('Window object not available (likely server-side or test environment)');
    return null;
  }
  return window;
}

/**
 * 안전한 Location 접근
 */
export function safeLocation(): Location | null {
  const win = safeWindow();
  return win?.location ?? null;
}

/**
 * 안전한 Navigator 접근
 */
export function safeNavigator(): Navigator | null {
  const win = safeWindow();
  return win?.navigator ?? null;
}

/**
 * 현재 페이지가 Twitter/X.com인지 확인
 */
export function isTwitterSite(): boolean {
  const location = safeLocation();
  if (!location) return false;

  return location.hostname.includes('x.com') || location.hostname.includes('twitter.com');
}

/**
 * 현재 URL 정보 안전하게 가져오기
 */
export function getCurrentUrlInfo(): {
  href: string;
  pathname: string;
  hostname: string;
  search: string;
} | null {
  const location = safeLocation();
  if (!location) return null;

  return {
    href: location.href,
    pathname: location.pathname,
    hostname: location.hostname,
    search: location.search,
  };
}

// Legacy scroll position function removed - use @infrastructure/dom instead

/**
 * 스크롤 위치 설정
 */
export function setScrollPosition(x: number, y: number): void {
  const win = safeWindow();
  if (win) {
    win.scrollTo(x, y);
  }
}

/**
 * 안전한 타이머 생성 (메모리 관리와 연동)
 */
export function safeSetTimeout(callback: () => void, delay: number): number | null {
  const win = safeWindow();
  if (!win) return null;

  return win.setTimeout(callback, delay);
}

/**
 * 안전한 타이머 해제
 */
export function safeClearTimeout(timerId: number | null): void {
  if (timerId === null) return;

  const win = safeWindow();
  if (win) {
    win.clearTimeout(timerId);
  }
}

/**
 * 뷰포트 크기 가져오기
 */
export function getViewportSize(): { width: number; height: number } {
  const win = safeWindow();
  if (!win) return { width: 0, height: 0 };

  return {
    width: win.innerWidth || 0,
    height: win.innerHeight || 0,
  };
}

/**
 * 디바이스 픽셀 비율 가져오기
 */
export function getDevicePixelRatio(): number {
  const win = safeWindow();
  return win?.devicePixelRatio ?? 1;
}

/**
 * 미디어 쿼리 매칭
 */
export function matchesMediaQuery(query: string): boolean {
  const win = safeWindow();
  if (!win?.matchMedia) return false;

  try {
    return win.matchMedia(query).matches;
  } catch (error) {
    logger.warn(`Failed to match media query "${query}":`, error);
    return false;
  }
}

/**
 * 다크 모드 감지
 */
export function isDarkMode(): boolean {
  return matchesMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * 리듀스드 모션 감지
 */
export function prefersReducedMotion(): boolean {
  return matchesMediaQuery('(prefers-reduced-motion: reduce)');
}
