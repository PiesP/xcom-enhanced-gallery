/**
 * @fileoverview 브라우저 전역 객체에 대한 안전한 접근 유틸리티
 * @version 1.0.0
 *
 * Window, Location, Navigator 등의 브라우저 전역 객체에 대한 타입 안전한 접근을 제공합니다.
 * 서버사이드 렌더링이나 테스트 환경에서도 안전하게 동작합니다.
 */

import { logger } from '@shared/logging/logger';

/**
 * 브라우저 환경 체크
 */
export function isExtensionEnvironment(): boolean {
  try {
    const win = safeWindow();
    if (!win) return false;

    // Chrome 확장 감지
    const chromeWin = win as Window & { chrome?: { runtime?: { id?: string } } };
    if (chromeWin.chrome?.runtime?.id) {
      return true;
    }

    // Firefox 확장 감지
    const firefoxWin = win as Window & { browser?: { runtime?: { id?: string } } };
    if (firefoxWin.browser?.runtime?.id) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * 브라우저 환경이 사용 가능한지 확인
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
  try {
    const win = safeWindow();
    if (!win) return null;

    // location 객체가 존재하는지 확인
    if (!win.location) return null;

    // location 객체가 부분적으로만 정의된 경우도 허용
    return win.location;
  } catch (error) {
    logger.debug('safeLocation: Location access failed:', error);
    return null;
  }
}

/**
 * 안전한 Navigator 접근
 */
export function safeNavigator(): Navigator | null {
  const win = safeWindow();
  if (!win?.navigator) return null;
  return win.navigator;
}

/**
 * 현재 페이지가 Twitter/X.com인지 확인
 */
export function isTwitterSite(): boolean {
  try {
    const location = safeLocation();
    if (!location) return false;

    const hostname = location.hostname.toLowerCase();

    // 정확한 도메인 매칭 (서브도메인 포함)
    return (
      hostname === 'x.com' ||
      hostname === 'twitter.com' ||
      hostname.endsWith('.x.com') ||
      hostname.endsWith('.twitter.com')
    );
  } catch (error) {
    logger.debug('isTwitterSite: Domain check failed:', error);
    return false;
  }
}

/**
 * 현재 URL 정보 안전하게 가져오기
 */
export function getCurrentUrlInfo(): {
  href: string;
  pathname: string;
  hostname: string;
  search: string;
} {
  const location = safeLocation();
  if (!location) {
    return {
      href: '',
      pathname: '',
      hostname: '',
      search: '',
    };
  }

  return {
    href: location.href || '',
    pathname: location.pathname || '',
    hostname: location.hostname || '',
    search: location.search || '',
  };
}

/**
 * 스크롤 위치 설정
 */
export function setScrollPosition(x: number, y: number): void {
  const win = safeWindow();
  if (win && typeof win.scrollTo === 'function') {
    win.scrollTo(x, y);
  }
}

/**
 * 안전한 타이머 생성 (메모리 관리와 연동)
 */
export function safeSetTimeout(callback: () => void, delay: number): number | null {
  const win = safeWindow();
  if (!win || typeof win.setTimeout !== 'function') return null;

  return win.setTimeout(callback, delay);
}

/**
 * 안전한 타이머 해제
 */
export function safeClearTimeout(timerId: number | null): void {
  if (timerId === null) return;

  const win = safeWindow();
  if (win && typeof win.clearTimeout === 'function') {
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

/**
 * 브라우저 정보 감지
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  isChrome: boolean;
  isFirefox: boolean;
  isSafari: boolean;
  isEdge: boolean;
} {
  const navigator = safeNavigator();

  if (!navigator) {
    return {
      name: 'Unknown',
      version: 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
    };
  }

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor || '';

  // Chrome 감지
  if (userAgent.includes('Chrome') && vendor.includes('Google')) {
    const versionMatch = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    return {
      name: 'Chrome',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: true,
      isFirefox: false,
      isSafari: false,
      isEdge: false,
    };
  }

  // Firefox 감지
  if (userAgent.includes('Firefox')) {
    const versionMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
    return {
      name: 'Firefox',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: true,
      isSafari: false,
      isEdge: false,
    };
  }

  // Safari 감지
  if (userAgent.includes('Safari') && vendor.includes('Apple') && !userAgent.includes('Chrome')) {
    const versionMatch = userAgent.match(/Version\/(\d+\.\d+)/);
    return {
      name: 'Safari',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: true,
      isEdge: false,
    };
  }

  // Edge 감지
  if (userAgent.includes('Edg')) {
    const versionMatch = userAgent.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
    return {
      name: 'Edge',
      version: versionMatch?.[1] ?? 'Unknown',
      isChrome: false,
      isFirefox: false,
      isSafari: false,
      isEdge: true,
    };
  }

  return {
    name: 'Unknown',
    version: 'Unknown',
    isChrome: false,
    isFirefox: false,
    isSafari: false,
    isEdge: false,
  };
}

/**
 * 브라우저 확장 컨텍스트 감지
 */
export function isExtensionContext(): boolean {
  try {
    const win = safeWindow();
    if (!win) return false;

    // Chrome 확장 감지
    const chromeWin = win as Window & { chrome?: { runtime?: { id?: string } } };
    if (chromeWin.chrome?.runtime?.id) {
      return true;
    }

    // Firefox 확장 감지
    const firefoxWin = win as Window & { browser?: { runtime?: { id?: string } } };
    if (firefoxWin.browser?.runtime?.id) {
      return true;
    }

    return false;
  } catch (error) {
    logger.debug('isExtensionContext: Extension detection failed:', error);
    return false;
  }
}
