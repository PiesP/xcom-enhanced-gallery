/**
 * @fileoverview StabilityDetector 서비스
 * @description Activity 기반 settling 상태 감지 메커니즘
 * @module shared/services/stability-detector
 *
 * 책임:
 * - Activity 이벤트 기록 (scroll, focus, layout, programmatic)
 * - Settling 상태 판정 (idle time 기반)
 * - 상태 변화 감지 및 콜백 호출
 * - 메트릭 조회 (activity 통계)
 */

import { getSolid } from '../external/vendors';
import { logger } from '../logging/logger';

export type ActivityType = 'scroll' | 'focus' | 'layout' | 'programmatic';

export interface StabilityMetrics {
  totalActivities: number;
  lastActivityType: ActivityType | null;
  lastActivityTime: number;
  isStable: boolean;
  activityByType: Record<ActivityType, number>;
}

export interface StabilityDetector {
  /** 현재 안정 상태 (Signal) */
  isStable(): boolean;

  /** 마지막 activity 시간 (Signal) */
  lastActivityTime(): number;

  /** Activity 기록 */
  recordActivity(type: ActivityType): void;

  /** Settling 상태 확인 */
  checkStability(threshold?: number): boolean;

  /** 상태 변화 리스너 등록 */
  onStabilityChange(callback: (isStable: boolean) => void): () => void;

  /** 메트릭 조회 */
  getMetrics(): StabilityMetrics;

  /** 상태 초기화 */
  clear(): void;
}

const DEFAULT_STABILITY_THRESHOLD = 300; // ms

export function createStabilityDetector(): StabilityDetector {
  const { createSignal } = getSolid();

  const [isStableSignal, setIsStableSignal] = createSignal(true);
  const [lastActivityTimeSignal, setLastActivityTimeSignal] = createSignal(0);

  const activityEvents: Array<{ type: ActivityType; time: number }> = [];
  const stateChangeListeners: Set<(isStable: boolean) => void> = new Set();
  let currentStableState = true;

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

    // 메모리 효율성: 최근 1000개 이벤트만 유지
    if (activityEvents.length > 1000) {
      activityEvents.shift();
    }

    setLastActivityTimeSignal(now);

    // Activity 기록 시 불안정 상태로 전환
    updateStability(false);

    logger.debug('StabilityDetector: activity recorded', {
      type,
      totalActivities: activityEvents.length,
    });
  };

  const checkStability = (threshold: number = DEFAULT_STABILITY_THRESHOLD): boolean => {
    if (activityEvents.length === 0) {
      updateStability(true);
      return true;
    }

    const lastActivity = activityEvents[activityEvents.length - 1]!;
    const timeSinceLastActivity = Date.now() - lastActivity.time;
    const isNowStable = timeSinceLastActivity >= threshold;

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
