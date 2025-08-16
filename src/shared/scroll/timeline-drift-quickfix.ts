/**
 * @fileoverview Quick Fix for Timeline Position Drift
 * 타임라인 위치 드리프트 문제에 대한 즉시 적용 가능한 해결책
 */

import { logger } from '@shared/logging';
import {
  applyQuickFixPreset,
  applyAdvancedDriftPreset,
  applyAllScrollPresetsForDev,
} from './scroll-restoration-presets';

const LOG = { quickfix: '[scroll/quickfix-deprecated]' };

// 드리프트 모니터링 상수
const DRIFT_THRESHOLD_PX = 10; // 10px 이상 변화 시 로깅
const MONITOR_DEBOUNCE_MS = 100; // 100ms 디바운싱

/**
 * 타임라인 드리프트 Quick Fix 설정
 *
 * 즉시 적용 가능한 개선 사항:
 * 1. 타임아웃 증가: 50ms → 150ms
 * 2. 다중 패스 보정 활성화
 * 3. 레거시 키 지원 강화
 */
export function applyTimelineDriftQuickFix(): void {
  logger.info(`${LOG.quickfix} (deprecated wrapper) applyQuickFixPreset 호출`);
  applyQuickFixPreset();
}

/**
 * 타임라인 드리프트 최적화 설정
 *
 * 더 강력한 드리프트 방지 설정:
 * 1. 안정화 우선 모드
 * 2. 확장된 타임아웃
 * 3. 적응형 보정
 */
export function applyAdvancedDriftPrevention(): void {
  logger.info(`${LOG.quickfix} (deprecated wrapper) applyAdvancedDriftPreset 호출`);
  applyAdvancedDriftPreset();
}

/**
 * 개발/디버깅용 드리프트 모니터링 활성화
 */
export function enableDriftMonitoring(): void {
  logger.info(`${LOG.quickfix} 드리프트 모니터링 활성화`);

  // 스크롤 이벤트 모니터링 (개발용)
  if (typeof window !== 'undefined') {
    let lastScrollY = window.scrollY || 0;
    let scrollEventCount = 0;

    const monitorScroll = () => {
      const currentScrollY = window.scrollY || 0;
      const drift = Math.abs(currentScrollY - lastScrollY);

      if (drift > DRIFT_THRESHOLD_PX) {
        // 10px 이상 변화 시 로깅
        logger.debug(`${LOG.quickfix} 스크롤 변화 감지:`, {
          event: ++scrollEventCount,
          from: lastScrollY,
          to: currentScrollY,
          drift,
        });
      }

      lastScrollY = currentScrollY;
    };

    // 디바운싱된 스크롤 모니터링
    let monitorTimeout: ReturnType<typeof setTimeout>;
    window.addEventListener(
      'scroll',
      () => {
        clearTimeout(monitorTimeout);
        monitorTimeout = setTimeout(monitorScroll, MONITOR_DEBOUNCE_MS);
      },
      { passive: true }
    );

    logger.info(`${LOG.quickfix} 스크롤 모니터링 리스너 등록 완료`);
  }
}

/**
 * 통합 Quick Fix 적용
 * 모든 즉시 개선 사항을 한 번에 적용
 */
export function applyAllQuickFixes(): void {
  logger.info(`${LOG.quickfix} (deprecated wrapper) applyAllScrollPresetsForDev 호출`);
  applyAllScrollPresetsForDev();
}

// 자동 적용 (개발 환경)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // 페이지 로드 후 자동 적용
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllQuickFixes);
  } else {
    applyAllQuickFixes();
  }
}
