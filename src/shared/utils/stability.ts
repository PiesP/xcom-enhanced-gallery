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
 *
 * Phase 420 cleanup:
 * This module now provides a minimal no-op stub so that production bundles
 * remain free of performance instrumentation while legacy tests keep compiling.
 */

export type ActivityType = 'scroll' | 'focus' | 'layout' | 'programmatic';

export interface StabilityConfig {
  readonly userScrollThreshold?: number;
  readonly programmaticThreshold?: number;
  readonly mixedThreshold?: number;
}

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

const EMPTY_ACTIVITY_COUNTS: Record<ActivityType, number> = {
  scroll: 0,
  focus: 0,
  layout: 0,
  programmatic: 0,
};

const createMetricsSnapshot = (): StabilityMetrics => ({
  totalActivities: 0,
  lastActivityType: null,
  lastActivityTime: 0,
  isStable: true,
  activityByType: { ...EMPTY_ACTIVITY_COUNTS },
});

export function createStabilityDetector(_config?: Partial<StabilityConfig>): StabilityDetector {
  const listeners = new Set<(isStable: boolean) => void>();

  const subscribe = (callback: (isStable: boolean) => void): (() => void) => {
    listeners.add(callback);
    // Immediately report the always-stable state so callers keep their logic simple.
    try {
      callback(true);
    } catch {
      // Ignore callbacks that throw during subscription.
    }

    return () => {
      listeners.delete(callback);
    };
  };

  return {
    isStable: () => true,
    lastActivityTime: () => 0,
    recordActivity: () => {
      /** Intentionally noop – performance instrumentation removed. */
    },
    checkStability: () => true,
    onStabilityChange: subscribe,
    getMetrics: () => createMetricsSnapshot(),
    clear: () => {
      listeners.clear();
    },
  };
}

export type IStabilityDetector = ReturnType<typeof createStabilityDetector>;
