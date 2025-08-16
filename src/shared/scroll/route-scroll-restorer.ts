/**
 * @fileoverview Route 기반 스크롤 저장/복원 자동화
 * Single Page Navigation (history API) 감시하여 페이지 전환 시 스크롤 위치 저장 & 복원
 */
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { buildRouteScrollKey } from '@shared/scroll/route-scroll-key-builder';
import { logger } from '@shared/logging';

interface RouteScrollRestorerOptions {
  enable?: boolean; // 기본 true
  smooth?: boolean; // 기본 false
  keyBuilder?: (pathname: string) => string; // 커스텀 키 생성
  immediate?: boolean; // 복원 즉시 여부 (true: immediate, false: delayed)
}

let initialized = false;
let lastPathname: string | null = null;
let unpatch: (() => void) | null = null;

export function initializeRouteScrollRestorer(options: RouteScrollRestorerOptions = {}): void {
  if (initialized) return;
  const { enable = true, smooth = false, keyBuilder, immediate = true } = options;
  if (!enable || typeof window === 'undefined' || !window.history) return;

  try {
    lastPathname = window.location.pathname;

    const buildKey = (path: string) => (keyBuilder ? keyBuilder(path) : buildRouteScrollKey(path)); // formatted

    const restoreCurrent = () => {
      try {
        ScrollPositionController.restore({
          key: buildKey(window.location.pathname),
          smooth,
          mode: immediate ? 'immediate' : 'delayed',
        });
      } catch (e) {
        logger.debug('[RouteScrollRestorer] restore 실패', e);
      }
    };

    // history API 패치
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    function handleNavigation() {
      const newPath = window.location.pathname;
      if (newPath === lastPathname) return;
      // 기존 lastPathname 의 스크롤 위치를 저장 (이전 경로)
      const prevPath = lastPathname;
      if (prevPath) {
        try {
          ScrollPositionController.save({ key: buildKey(prevPath) });
        } catch (e) {
          logger.debug('[RouteScrollRestorer] prev save 실패', e);
        }
      }
      // 상태 업데이트
      lastPathname = newPath;
      // 새 경로로 전환된 후 해당 경로의 저장된 스크롤 복원
      restoreCurrent();
    }

    window.history.pushState = function (
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      const ret = origPush.call(this, data as unknown as object, unused, url ?? undefined);
      handleNavigation();
      return ret;
    } as typeof window.history.pushState;

    window.history.replaceState = function (
      this: History,
      data: unknown,
      unused: string,
      url?: string | URL | null
    ) {
      const ret = origReplace.call(this, data as unknown as object, unused, url ?? undefined);
      handleNavigation();
      return ret;
    } as typeof window.history.replaceState;

    window.addEventListener('popstate', handleNavigation, { passive: true });

    unpatch = () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener('popstate', handleNavigation);
    };

    initialized = true;
    logger.debug('[RouteScrollRestorer] 초기화 완료');
  } catch (error) {
    logger.warn('[RouteScrollRestorer] 초기화 실패', error);
  }
}

export function cleanupRouteScrollRestorer(): void {
  try {
    unpatch?.();
  } catch {
    /* ignore */
  }
  initialized = false;
  lastPathname = null;
  unpatch = null;
}

export function isRouteScrollRestorerInitialized(): boolean {
  return initialized;
}
