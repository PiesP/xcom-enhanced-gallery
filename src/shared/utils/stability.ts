/**
 * @fileoverview Stability Detector Utility
 * @description Activity-based settling state detection mechanism
 * @version 2.0.0 - Moved from services to utils (Signal-based utility)
 *
 * Responsibilities:
 * - Record activity events (scroll, focus, layout, programmatic)
 * - Determine settling state (based on idle time)
 * - Detect state changes and invoke callbacks
 * - Get metrics (activity statistics)
 * - Phase 83.4: Automatic stability check (Lazy checkStability)
 */

import { getSolid } from '../external/vendors';
import { logger } from '../logging';
import { globalTimerManager } from './timer-management';

export type ActivityType = 'scroll' | 'focus' | 'layout' | 'programmatic';

// ✅ Phase 83.4: Adaptive Threshold settings
export interface StabilityConfig {
  userScrollThreshold: number; // User scroll: 200ms (quick response)
  programmaticThreshold: number; // Auto scroll: 400ms (wait for animation)
  mixedThreshold: number; // Mixed: 300ms (stable middle value)
}

// Phase 83.4: Default adaptive threshold settings
const DEFAULT_CONFIG: StabilityConfig = {
  userScrollThreshold: 200,
  programmaticThreshold: 400,
  mixedThreshold: 300,
};

export interface StabilityMetrics {
  totalActivities: number;
  lastActivityType: ActivityType | null;
  lastActivityTime: number;
  isStable: boolean;
  activityByType: Record<ActivityType, number>;
}

export interface StabilityDetector {
  /** Current stable state (Signal) */
  isStable(): boolean;

  /** Last activity time (Signal) */
  lastActivityTime(): number;

  /** Record activity */
  recordActivity(type: ActivityType): void;

  /** Check settling state */
  checkStability(threshold?: number): boolean;

  /** Register stability change listener */
  onStabilityChange(callback: (isStable: boolean) => void): () => void;

  /** Get metrics */
  getMetrics(): StabilityMetrics;

  /** 상태 초기화 */
  clear(): void;
}

const MAX_EVENT_AGE = 60000; // Phase 83.4: 60초 이상 된 이벤트 자동 정리
const PRUNE_INTERVAL = 100; // Phase 83.4: 100개마다 정리 실행

// ✅ Phase 83.4: Adaptive Threshold 구현
export function createStabilityDetector(config?: Partial<StabilityConfig>): StabilityDetector {
  const { createSignal } = getSolid();

  const adaptiveConfig: StabilityConfig = { ...DEFAULT_CONFIG, ...config };

  const [isStableSignal, setIsStableSignal] = createSignal(true);
  const [lastActivityTimeSignal, setLastActivityTimeSignal] = createSignal(0);

  const activityEvents: Array<{ type: ActivityType; time: number }> = [];
  const stateChangeListeners: Set<(isStable: boolean) => void> = new Set();
  let currentStableState = true;
  let stabilityCheckTimerId: number | null = null; // Phase 83.4: 자동 안정성 체크 타이머

  const clearStabilityCheckTimer = () => {
    if (stabilityCheckTimerId !== null) {
      globalTimerManager.clearTimeout(stabilityCheckTimerId);
      stabilityCheckTimerId = null;
    }
  };

  // ✅ Phase 83.4: 시간 기반 자동 정리
  // 60초 이상 된 오래된 이벤트를 자동으로 제거하여 메모리 효율성 향상
  const pruneOldEvents = () => {
    const cutoff = Date.now() - MAX_EVENT_AGE;
    const validIndex = activityEvents.findIndex(e => e.time >= cutoff);

    if (validIndex > 0) {
      activityEvents.splice(0, validIndex);
      logger.debug('StabilityDetector: pruned old events', { removed: validIndex });
    }
  };

  const updateStability = (newState: boolean) => {
    if (currentStableState !== newState) {
      currentStableState = newState;
      setIsStableSignal(newState);

      // 모든 리스너에 알림
      stateChangeListeners.forEach(callback => {
        try {
          callback(newState);
        } catch (error) {
          logger.error('StabilityDetector: callback error', { error });
        }
      });

      logger.debug('StabilityDetector: stability changed', {
        isStable: newState,
        eventCount: activityEvents.length,
      });
    }
  };

  const recordActivity = (type: ActivityType) => {
    const now = Date.now();
    activityEvents.push({ type, time: now });

    // ✅ Phase 83.4: 메모리 효율성 개선
    // 1000개 제한 제거하고 시간 기반 정리로 대체
    // 100개마다 정리 실행하여 성능 최적화
    if (activityEvents.length % PRUNE_INTERVAL === 0) {
      pruneOldEvents();
    }

    setLastActivityTimeSignal(now);

    // Activity 기록 시 불안정 상태로 전환
    updateStability(false);

    // ✅ Phase 83.4: 자동 안정성 체크 스케줄링 - adaptive threshold 사용
    // 명시적 checkStability() 호출 없이도 자동으로 settling 감지
    clearStabilityCheckTimer();
    stabilityCheckTimerId = globalTimerManager.setTimeout(() => {
      const isNowStable = checkStability();
      if (isNowStable) {
        updateStability(true); // 자동으로 콜백 실행
      }
      stabilityCheckTimerId = null;
    }, getAdaptiveThreshold() + 50); // adaptive threshold + 50ms 마진

    logger.debug('StabilityDetector: activity recorded', {
      type,
      totalActivities: activityEvents.length,
    });
  };

  // ✅ Phase 83.4: Adaptive Threshold 판정
  // 최근 activity 패턴에 따라 최적의 threshold를 동적으로 선택
  const getAdaptiveThreshold = (): number => {
    const recentActivities = activityEvents.slice(-5); // 최근 5개 확인
    const hasProgrammatic = recentActivities.some(e => e.type === 'programmatic');
    const hasScroll = recentActivities.some(e => e.type === 'scroll');

    if (hasProgrammatic && hasScroll) return adaptiveConfig.mixedThreshold;
    if (hasProgrammatic) return adaptiveConfig.programmaticThreshold;
    return adaptiveConfig.userScrollThreshold;
  };

  const checkStability = (threshold?: number): boolean => {
    if (activityEvents.length === 0) {
      updateStability(true);
      return true;
    }

    const lastActivity = activityEvents[activityEvents.length - 1]!;
    const timeSinceLastActivity = Date.now() - lastActivity.time;

    // ✅ Phase 83.4: threshold가 명시적으로 제공되면 사용, 아니면 adaptive threshold 사용
    const effectiveThreshold = threshold ?? getAdaptiveThreshold();
    const isNowStable = timeSinceLastActivity >= effectiveThreshold;

    if (isNowStable) {
      updateStability(true);
    }

    return isNowStable;
  };

  const onStabilityChange = (callback: (isStable: boolean) => void): (() => void) => {
    stateChangeListeners.add(callback);

    // 구독 해제 함수
    return () => {
      stateChangeListeners.delete(callback);
    };
  };

  const getMetrics = (): StabilityMetrics => {
    const activityByType: Record<ActivityType, number> = {
      scroll: 0,
      focus: 0,
      layout: 0,
      programmatic: 0,
    };

    activityEvents.forEach(event => {
      activityByType[event.type]++;
    });

    const lastActivity = activityEvents[activityEvents.length - 1];

    return {
      totalActivities: activityEvents.length,
      lastActivityType: lastActivity?.type ?? null,
      lastActivityTime: lastActivity?.time ?? 0,
      isStable: currentStableState,
      activityByType,
    };
  };

  const clear = () => {
    activityEvents.length = 0;
    setLastActivityTimeSignal(0);
    updateStability(true);
    clearStabilityCheckTimer(); // Phase 83.4: 타이머도 정리

    logger.debug('StabilityDetector: cleared');
  };

  return {
    isStable: isStableSignal,
    lastActivityTime: lastActivityTimeSignal,
    recordActivity,
    checkStability,
    onStabilityChange,
    getMetrics,
    clear,
  };
}

export type IStabilityDetector = ReturnType<typeof createStabilityDetector>;
