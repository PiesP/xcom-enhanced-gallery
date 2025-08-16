/**
 * @fileoverview Route 기반 스크롤 저장/복원 자동화
 * Single Page Navigation (history API) 감시하여 페이지 전환 시 스크롤 위치 저장 & 복원
 */
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { AnchorScrollPositionController } from '@shared/scroll/anchor-scroll-position-controller';
import { buildRouteScrollKey } from '@shared/scroll/route-scroll-key-builder';
import { getScrollRestorationConfig } from './scroll-restoration-config';
import { stabilizeTimelinePosition } from './timeline-position-stabilizer';
import { logger } from '@shared/logging';
const LOG = { restorer: '[scroll/restorer]' };

interface RouteScrollRestorerOptions {
  enable?: boolean; // 기본 true
  keyBuilder?: (pathname: string) => string; // 커스텀 키 생성
  // 2025-08-16: smooth, immediate 옵션 제거 - 모든 복원은 앵커 우선 + 즉시 복원으로 통일
}

let initialized = false;
let lastPathname: string | null = null;
let unpatch: (() => void) | null = null;

export function initializeRouteScrollRestorer(options: RouteScrollRestorerOptions = {}): void {
  if (initialized) return;
  const { enable = true, keyBuilder } = options;
  if (!enable || typeof window === 'undefined' || !window.history) return;

  try {
    lastPathname = window.location.pathname;

    const buildKey = (path: string) => (keyBuilder ? keyBuilder(path) : buildRouteScrollKey(path)); // formatted

    /** 공통 전략 실행 (restore/save) */
    function executeStrategy(
      phase: 'restore' | 'save',
      name: string,
      ctx: { key: string; pathname: string }
    ): boolean {
      try {
        logger.info(`${LOG.restorer} ${phase} 전략 시도:`, name);
        if (name === 'anchor') {
          if (phase === 'restore') {
            const cfg = getScrollRestorationConfig();
            return AnchorScrollPositionController.restore({
              pathname: ctx.pathname,
              observe: cfg.enableAnchorObserver !== false,
              timeoutMs: cfg.stabilizationTimeoutMs as number,
            });
          }
          // save
          const saved = AnchorScrollPositionController.save({ pathname: ctx.pathname });
          // 앵커 저장 실패한 경우에만 절대 좌표 백업 (이전: 항상 백업 → 불필요한 중복)
          if (!saved) {
            try {
              const abs = ScrollPositionController.save({ key: ctx.key });
              return saved || abs;
            } catch {
              return saved;
            }
          }
          return saved;
        } else if (name === 'absolute') {
          if (phase === 'restore') {
            return ScrollPositionController.restore({
              key: ctx.key,
              smooth: false,
              mode: 'immediate',
            });
          }
          return ScrollPositionController.save({ key: ctx.key });
        }
      } catch (e) {
        logger.info(`${LOG.restorer} ${phase} 전략 실패:`, { name, e });
      }
      return false;
    }

    const restoreCurrent = () => {
      try {
        // 브라우저 기본 스크롤 복원 강제 차단
        try {
          if (window.history?.scrollRestoration) {
            window.history.scrollRestoration = 'manual';
          }
        } catch {
          // ignore
        }

        const pathname = window.location.pathname;
        const key = buildKey(pathname);
        logger.info(`${LOG.restorer} 복원 시작:`, { pathname, key });

        // 강화된 앵커 우선 즉시 복원 정책
        const order = getScrollRestorationConfig().strategyOrder || ['anchor', 'absolute'];
        logger.info(`${LOG.restorer} 복원 전략 순서:`, order);

        const cfg = getScrollRestorationConfig();
        const ctx = { key, pathname };
        const restored = order.some(name => executeStrategy('restore', name, ctx));

        // 후처리 드리프트 안정화 (단일 통합 stabilizer 사용)
        if (restored && cfg.enableDriftStabilization !== false) {
          try {
            requestAnimationFrame(() => {
              requestAnimationFrame(async () => {
                try {
                  const articles = document.querySelectorAll('article[data-testid="tweet"]');
                  let anchorEl: Element | undefined;
                  let minDelta = Number.POSITIVE_INFINITY;
                  for (const a of Array.from(articles)) {
                    const rect = a.getBoundingClientRect();
                    const delta = Math.abs(rect.top);
                    if (delta < minDelta) {
                      minDelta = delta;
                      anchorEl = a;
                    }
                  }
                  if (anchorEl) {
                    logger.info(`${LOG.restorer} 통합 안정화 수행 시작`);
                    // 매직 넘버(300ms) 제거: 안정화 기본 타임아웃 상수 사용
                    const FALLBACK_STABILIZATION_TIMEOUT_MS = 300;
                    const timeoutMs =
                      typeof cfg.stabilizationTimeoutMs === 'number'
                        ? cfg.stabilizationTimeoutMs
                        : FALLBACK_STABILIZATION_TIMEOUT_MS; // fallback 안전값
                    await stabilizeTimelinePosition(anchorEl, 0, {
                      stabilityTimeoutMs: timeoutMs,
                      maxCorrectionAttempts: 2,
                    });
                  }
                } catch (e) {
                  logger.debug(`${LOG.restorer} 통합 안정화 중 오류`, e);
                }
              });
            });
          } catch {
            /* ignore stabilization errors */
          }
        }
      } catch (e) {
        logger.info(`${LOG.restorer} restore 실패`, e);
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
          logger.info(`${LOG.restorer} 이전 경로 스크롤 저장 시작:`, { prevPath, newPath });

          // 등록된 전략에게 저장 요청 (anchor 우선, 실패 시 absolute 등 나머지 수행)
          const order = getScrollRestorationConfig().strategyOrder || ['anchor', 'absolute'];
          logger.info(`${LOG.restorer} 저장 전략 순서:`, order);
          const ctx = { key: buildKey(prevPath), pathname: prevPath };
          const saved = order.some(name => {
            if (name === 'anchor') {
              // dualAbsolute 활성화로 앵커 실패 시 자동 절대 백업
              return AnchorScrollPositionController.save({
                pathname: ctx.pathname,
                dualAbsolute: true,
              });
            }
            return executeStrategy('save', name, ctx);
          });
          if (!saved) {
            logger.info(
              `${LOG.restorer} 모든 전략 실패 (폴백 없음 - anchor 실패시 absolute 백업 이미 시도됨)`
            );
          } else {
            logger.info(`${LOG.restorer} 전략 기반 저장 완료`);
          }
        } catch (e) {
          logger.info(`${LOG.restorer} prev save 실패`, e);
        }
      } else {
        logger.info(`${LOG.restorer} 이전 경로 없음, 저장 건너뜀`);
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
    logger.debug(`${LOG.restorer} 초기화 완료`);
  } catch (error) {
    logger.warn(`${LOG.restorer} 초기화 실패`, error);
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
