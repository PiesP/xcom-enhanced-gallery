/**
 * @fileoverview Browser 환경 체크 유틸리티 - 환경 감지 및 안전한 글로벌 접근 전용
 * Phase 1.3 GREEN: 환경 체크 기능을 별도 모듈로 분리
 */

import { logger } from '@shared/logging';
import { TIME_CONSTANTS } from '@/constants';
import { matchTimelinePath } from './timeline-path-config';

// ----------------------------------------------------------------------------
// Scroll Position Management Enhancements (Phase: Hardening)
// - Path 기반 네임스페이스 키
// - 만료 시간 적용 (기본 5분)
// - 복원 성공 시 자동 제거
// - 테스트 용 헬퍼 노출 (__test_only_*)
// ----------------------------------------------------------------------------

/** 스크롤 위치 저장 항목 만료 시간 (ms) */
export const SCROLL_POSITION_MAX_AGE_MS = TIME_CONSTANTS.FIVE_MINUTES;

/** 내부: 현재 pathname 기반 키 생성 */
function buildScrollStorageKey(baseKey: string): string {
  try {
    const win = safeWindow();
    const pathname = win?.location?.pathname || '';
    if (!pathname || pathname === '/' || baseKey !== 'scrollPosition') return baseKey;
    return `${baseKey}:${pathname}`;
  } catch {
    return baseKey;
  }
}

/** 테스트 용도로 key 생성 로직 노출 */
export const __test_only_buildScrollKey = (baseKey = 'scrollPosition'): string =>
  buildScrollStorageKey(baseKey);

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
 * @returns window 객체 또는 null
 */
export const safeWindow = (): Window | null => {
  try {
    if (!isBrowserEnvironment()) return null;

    const win = window as unknown as Record<string | symbol, unknown>;

    // jsdom 일부 버전에서 window.location getter가 내부 _location 상태에 따라 throw 할 수 있음
    // 이를 방어하기 위해 Proxy로 감싸 location 접근을 안전하게 처리
    const proxy = new Proxy(win, {
      get(target, prop, receiver) {
        if (prop === 'location') {
          try {
            const loc = Reflect.get(target, prop, receiver);
            // jsdom의 Null 객체 접근 방지: falsy면 null 반환
            return loc ?? null;
          } catch {
            // 접근 중 오류 발생 시 null 반환
            return null;
          }
        }
        try {
          return Reflect.get(target, prop, receiver);
        } catch {
          return undefined;
        }
      },
    });

    return proxy as unknown as Window;
  } catch (error) {
    logger.debug('Failed to access window object', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
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

    // 네임스페이스 적용
    const storageKey = buildScrollStorageKey(key);

    const x = win.scrollX || win.pageXOffset || 0;
    const y = win.scrollY || win.pageYOffset || 0;

    // NaN이나 음수 값은 저장하지 않음
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      logger.debug('Invalid scroll position values, not saving', { x, y });
      return false;
    }

    const scrollData = {
      x,
      y,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(storageKey, JSON.stringify(scrollData));
    logger.debug('Scroll position saved', { key: storageKey, scrollData });

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

    // 타임라인(홈/사용자) 경로 감지: 즉시 복원 강제 (smooth 무시)
    let effectiveSmooth = smooth;
    try {
      const loc = win.location;
      const pathname = loc?.pathname || '';
      const { isTimeline } = matchTimelinePath(pathname);
      logger.info('[restoreScrollPosition] 경로 분석:', {
        pathname,
        isTimeline,
        originalSmooth: smooth,
      });
      if (isTimeline) {
        effectiveSmooth = false; // 타임라인은 항상 즉시 복원
        logger.info('[restoreScrollPosition] 타임라인 감지 - 즉시 복원 강제');
      }
    } catch {
      // 위치 접근 실패 시 무시 (테스트/비브라우저 환경)
    }

    const storageKey = buildScrollStorageKey(key);
    const savedData = sessionStorage.getItem(storageKey);
    if (!savedData) {
      logger.info('[restoreScrollPosition] 저장된 스크롤 위치 없음', { key: storageKey });
      return false;
    }

    const scrollData = JSON.parse(savedData) as {
      x: number;
      y: number;
      timestamp: number;
    };

    logger.info('[restoreScrollPosition] 저장된 스크롤 데이터:', scrollData);

    // 만료 체크
    const age = Date.now() - (scrollData.timestamp || 0);
    if (age > SCROLL_POSITION_MAX_AGE_MS) {
      sessionStorage.removeItem(storageKey);
      logger.debug('Expired scroll position discarded', { key: storageKey, age });
      return false;
    }

    if (effectiveSmooth) {
      // 명시적 smooth
      logger.info('[restoreScrollPosition] smooth 스크롤 실행:', {
        x: scrollData.x,
        y: scrollData.y,
      });
      win.scrollTo({
        left: scrollData.x || 0,
        top: scrollData.y || 0,
        behavior: 'smooth',
      });
    } else {
      // 즉시 복원 전략
      logger.info('[restoreScrollPosition] 즉시 스크롤 실행:', {
        x: scrollData.x,
        y: scrollData.y,
      });
      try {
        const docEl = win.document?.documentElement as HTMLElement | undefined;
        const originalInline = docEl ? docEl.style.scrollBehavior : '';
        if (docEl) {
          // 전역 CSS의 smooth 영향을 일시 무력화
          docEl.style.scrollBehavior = 'auto';
        }

        win.scrollTo({
          left: scrollData.x || 0,
          top: scrollData.y || 0,
          behavior: 'auto',
        });
        // 2차 보정 로직 제거 (Anchor 기반 복원 도입으로 진동 방지)
        if (docEl) docEl.style.scrollBehavior = originalInline;
        logger.info('[restoreScrollPosition] 즉시 스크롤 완료');
      } catch {
        // 폴백: 기존 동작 유지
        logger.info('[restoreScrollPosition] 폴백 스크롤 실행');
        win.scrollTo(scrollData.x || 0, scrollData.y || 0);
      }
    }

    // 성공 시 자동 제거 (재적용 방지)
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }

    logger.debug('Scroll position restored', { key: storageKey, scrollData });

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
    const storageKey = buildScrollStorageKey(key);
    sessionStorage.removeItem(storageKey);
    logger.debug('Scroll position cleared', { key: storageKey });
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

/**
 * 🔴 RED: 안전한 location 객체 접근
 * @returns location 객체 또는 null
 */
export const safeLocation = (): Location | null => {
  try {
    const win = safeWindow();
    return win?.location || null;
  } catch (error) {
    logger.debug('Failed to access location object', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * 🔴 RED: 안전한 navigator 객체 접근
 * @returns navigator 객체 또는 null
 */
export const safeNavigator = (): Navigator | null => {
  try {
    const win = safeWindow();
    return win?.navigator || null;
  } catch (error) {
    logger.debug('Failed to access navigator object', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * 🔴 RED: Twitter 사이트 여부 확인
 * @returns Twitter 사이트 여부
 */
export const isTwitterSite = (): boolean => {
  try {
    const location = safeLocation();
    if (!location) return false;

    const hostname = location.hostname.toLowerCase();
    return (
      hostname === 'x.com' ||
      hostname === 'www.x.com' ||
      hostname === 'mobile.x.com' ||
      hostname === 'twitter.com' ||
      hostname === 'www.twitter.com' ||
      hostname === 'mobile.twitter.com'
    );
  } catch (error) {
    logger.debug('Failed to check Twitter site', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};

/**
 * 🔴 RED: 현재 URL 정보 반환
 * @returns URL 정보 객체
 */
export const getCurrentUrlInfo = (): {
  href: string;
  pathname: string;
  hostname: string;
  search: string;
} => {
  try {
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
      href: location.href,
      pathname: location.pathname,
      hostname: location.hostname,
      search: location.search,
    };
  } catch (error) {
    logger.debug('Failed to get current URL info', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      href: '',
      pathname: '',
      hostname: '',
      search: '',
    };
  }
};

/**
 * 🔴 RED: 스크롤 위치 설정
 * @param x - X 좌표
 * @param y - Y 좌표
 */
export const setScrollPosition = (x: number, y: number): void => {
  try {
    const win = safeWindow();
    if (win?.scrollTo) {
      win.scrollTo(x, y);
    }
  } catch (error) {
    logger.debug('Failed to set scroll position', {
      error: error instanceof Error ? error.message : String(error),
      x,
      y,
    });
  }
};

/**
 * 🔴 RED: 안전한 setTimeout
 * @param callback - 실행할 콜백
 * @param delay - 지연 시간
 * @returns 타이머 ID 또는 null
 */
export const safeSetTimeout = (callback: () => void, delay: number): number | null => {
  try {
    const win = safeWindow();
    if (win?.setTimeout) {
      return win.setTimeout(callback, delay);
    }
    return null;
  } catch (error) {
    logger.debug('Failed to set timeout', {
      error: error instanceof Error ? error.message : String(error),
      delay,
    });
    return null;
  }
};

/**
 * 🔴 RED: 안전한 clearTimeout
 * @param timerId - 타이머 ID
 */
export const safeClearTimeout = (timerId: number | null): void => {
  try {
    if (timerId === null) return;

    const win = safeWindow();
    if (win?.clearTimeout) {
      win.clearTimeout(timerId);
    }
  } catch (error) {
    logger.debug('Failed to clear timeout', {
      error: error instanceof Error ? error.message : String(error),
      timerId,
    });
  }
};

/**
 * 🔴 RED: 뷰포트 크기 반환
 * @returns 뷰포트 크기 객체
 */
export const getViewportSize = (): { width: number; height: number } => {
  try {
    const win = safeWindow();
    if (!win) {
      return { width: 0, height: 0 };
    }

    return {
      width: win.innerWidth || 0,
      height: win.innerHeight || 0,
    };
  } catch (error) {
    logger.debug('Failed to get viewport size', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { width: 0, height: 0 };
  }
};

/**
 * 🔴 RED: 디바이스 픽셀 비율 반환
 * @returns 디바이스 픽셀 비율
 */
export const getDevicePixelRatio = (): number => {
  try {
    const win = safeWindow();
    return win?.devicePixelRatio || 1;
  } catch (error) {
    logger.debug('Failed to get device pixel ratio', {
      error: error instanceof Error ? error.message : String(error),
    });
    return 1;
  }
};

/**
 * 🔴 RED: 미디어 쿼리 매칭
 * @param query - 미디어 쿼리 문자열
 * @returns 매칭 결과
 */
export const matchesMediaQuery = (query: string): boolean => {
  try {
    const win = safeWindow();
    if (!win?.matchMedia) {
      return false;
    }

    return win.matchMedia(query).matches;
  } catch (error) {
    logger.debug('Failed to match media query', {
      error: error instanceof Error ? error.message : String(error),
      query,
    });
    return false;
  }
};

/**
 * 🔴 RED: 다크 모드 감지
 * @returns 다크 모드 여부
 */
export const isDarkMode = (): boolean => {
  return matchesMediaQuery('(prefers-color-scheme: dark)');
};

/**
 * 🔴 RED: 애니메이션 감소 선호도 감지
 * @returns 애니메이션 감소 선호 여부
 */
export const prefersReducedMotion = (): boolean => {
  return matchesMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * 🟢 GREEN: 저장된 스크롤 Y 위치 반환
 * @param key - 조회할 키 이름 (기본값: 'scrollPosition')
 * @returns 저장된 스크롤 Y 위치 또는 null
 */
export const getSavedScrollPosition = (key: string = 'scrollPosition'): number | null => {
  if (!isBrowserEnvironment()) {
    return null;
  }

  try {
    const savedData = sessionStorage.getItem(key);
    if (!savedData) {
      return null;
    }

    const scrollData = JSON.parse(savedData) as {
      x: number;
      y: number;
      timestamp: number;
    };

    // NaN이나 음수 값은 null로 처리
    if (typeof scrollData.y !== 'number' || isNaN(scrollData.y) || scrollData.y < 0) {
      return null;
    }

    return scrollData.y;
  } catch (error) {
    logger.debug('Failed to get saved scroll position', {
      error: error instanceof Error ? error.message : String(error),
      key,
    });
    return null;
  }
};
