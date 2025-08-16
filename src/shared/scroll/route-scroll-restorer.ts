/**
 * @fileoverview Route 기반 스크롤 저장/복원 자동화
 * Single Page Navigation (history API) 감시하여 페이지 전환 시 스크롤 위치 저장 & 복원
 */
import { ScrollPositionController } from '@shared/scroll/scroll-position-controller';
import { AnchorScrollPositionController } from '@shared/scroll/anchor-scroll-position-controller';
import { buildRouteScrollKey } from '@shared/scroll/route-scroll-key-builder';
import { getScrollRestorationConfig } from './scroll-restoration-config';
import { timelineStabilizer } from './timeline-position-stabilizer';
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

        const key = buildKey(window.location.pathname);
        logger.info(`${LOG.restorer} 복원 시작:`, { pathname: window.location.pathname, key });

        // 강화된 앵커 우선 즉시 복원 정책
        const order = getScrollRestorationConfig().strategyOrder || ['anchor', 'absolute'];
        logger.info(`${LOG.restorer} 복원 전략 순서:`, order);

        const cfg = getScrollRestorationConfig();
        let restored = false;
        for (const strategyName of order) {
          try {
            logger.info(`${LOG.restorer} ${strategyName} 전략 시도`);
            if (strategyName === 'anchor') {
              const result = AnchorScrollPositionController.restore({
                pathname: window.location.pathname,
                observe: cfg.enableAnchorObserver !== false,
                timeoutMs: cfg.stabilizationTimeoutMs, // 설정에서 관리
              });
              logger.info(`${LOG.restorer} ${strategyName} 전략 결과:`, result);
              restored = restored || result;
              if (restored) break;
            } else if (strategyName === 'absolute') {
              const result = ScrollPositionController.restore({
                key,
                smooth: false,
                mode: 'immediate',
              });
              logger.info(`${LOG.restorer} ${strategyName} 전략 결과:`, result);
              restored = restored || result;
              if (restored) break;
            }
          } catch (err) {
            logger.info(`${LOG.restorer} ${strategyName} 전략 실패:`, err);
          }
        }

        // 후처리 드리프트 안정화 (anchor 성공 또는 absolute 복원 후 적용)
        try {
          if (restored && cfg.enableDriftStabilization !== false) {
            // 소규모 비동기: 레이아웃 settle 후 측정
            requestAnimationFrame(() => {
              requestAnimationFrame(async () => {
                try {
                  // 대표 앵커 후보: viewport 상단 근처 tweet
                  const articles = document.querySelectorAll('article[data-testid="tweet"]');
                  let anchorEl: Element | undefined;
                  let minDelta = Number.POSITIVE_INFINITY;
                  articles.forEach(a => {
                    const rect = a.getBoundingClientRect();
                    const delta = Math.abs(rect.top);
                    if (delta < minDelta) {
                      minDelta = delta;
                      anchorEl = a;
                    }
                  });
                  if (anchorEl) {
                    const drift = timelineStabilizer.detectPositionDrift(anchorEl, 0);
                    const threshold = cfg.driftThresholdPx; // 설정에서 관리
                    if (Math.abs(drift) > threshold) {
                      logger.info(`${LOG.restorer} 초기 드리프트 감지:`, { drift, threshold });
                      await timelineStabilizer.applyDriftCorrection(drift);
                    }
                  }
                } catch (e) {
                  logger.debug(`${LOG.restorer} 후처리 드리프트 안정화 실패`, e);
                }
              });
            });
          }
        } catch {
          /* ignore stabilization errors */
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
          let saved = false;
          const order = getScrollRestorationConfig().strategyOrder || ['anchor', 'absolute'];
          logger.info(`${LOG.restorer} 저장 전략 순서:`, order);

          for (const strategyName of order) {
            try {
              logger.info(`${LOG.restorer} ${strategyName} 저장 전략 시도`);
              if (strategyName === 'anchor') {
                const anchorSaved = AnchorScrollPositionController.save({ pathname: prevPath });
                logger.info(`${LOG.restorer} ${strategyName} 저장 결과:`, anchorSaved);
                saved = anchorSaved || saved;
                // 절대 좌표 백업 무조건 수행 (안전망)
                try {
                  const absoluteBackup = ScrollPositionController.save({ key: buildKey(prevPath) });
                  logger.info(`${LOG.restorer} absolute 백업 저장 결과:`, absoluteBackup);
                  saved = absoluteBackup || saved;
                } catch {
                  /* ignore */
                }
              } else if (strategyName === 'absolute') {
                const absoluteSaved = ScrollPositionController.save({ key: buildKey(prevPath) });
                logger.info(`${LOG.restorer} ${strategyName} 저장 결과:`, absoluteSaved);
                saved = absoluteSaved || saved;
              }
            } catch (err) {
              logger.info(`${LOG.restorer} ${strategyName} 저장 전략 실패:`, err);
            }
          }

          if (!saved) {
            logger.info(`${LOG.restorer} 모든 전략 실패, 폴백 저장 시도`);
            // 최종 폴백: 기존 로직 유지
            if (!AnchorScrollPositionController.save()) {
              const fallbackSaved = ScrollPositionController.save({ key: buildKey(prevPath) });
              logger.info(`${LOG.restorer} 폴백 절대 좌표 저장 결과:`, fallbackSaved);
            } else {
              logger.info(`${LOG.restorer} 폴백 앵커 저장 성공`);
            }
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
