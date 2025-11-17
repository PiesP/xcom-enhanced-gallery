/**
 * @fileoverview StabilityDetector 유틸리티 테스트
 * @description Activity 기반 settling 상태 감지 메커니즘 검증
 * @version 2.0.0 - services에서 utils로 이동
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  createStabilityDetector,
  type ActivityType,
  type IStabilityDetector,
} from '@shared/utils/stability';

describe.skip('StabilityDetector (deprecated)', () => {
  setupGlobalTestIsolation();

  let detector: IStabilityDetector;

  beforeEach(() => {
    detector = createStabilityDetector();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('생성 및 초기화', () => {
    it('should initialize with stable state', () => {
      expect(detector.isStable()).toBe(true);
      expect(detector.lastActivityTime()).toBe(0);
    });

    it('should initialize with empty activity events', () => {
      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(0);
    });
  });

  describe('Activity 기록', () => {
    it('should record activity and mark as unstable', () => {
      detector.recordActivity('scroll');

      expect(detector.isStable()).toBe(false);
      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(1);
      expect(metrics.lastActivityType).toBe('scroll');
    });

    it('should record multiple activity events', () => {
      detector.recordActivity('scroll');
      detector.recordActivity('focus');
      detector.recordActivity('scroll');

      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(3);
      expect(metrics.lastActivityType).toBe('scroll');
    });

    it('should update lastActivityTime on each record', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      detector.recordActivity('scroll');
      expect(detector.lastActivityTime()).toBe(now);

      vi.advanceTimersByTime(100);
      detector.recordActivity('focus');
      expect(detector.lastActivityTime()).toBe(now + 100);
    });

    it('should support all activity types', () => {
      const types: ActivityType[] = ['scroll', 'focus', 'layout', 'programmatic'];

      types.forEach((type, index) => {
        vi.advanceTimersByTime(10);
        detector.recordActivity(type);

        const metrics = detector.getMetrics();
        expect(metrics.lastActivityType).toBe(type);
        expect(metrics.totalActivities).toBe(index + 1);
      });
    });
  });

  describe('Settling 상태 판정', () => {
    it('should return false when activity just recorded', () => {
      detector.recordActivity('scroll');
      expect(detector.checkStability(300)).toBe(false);
    });

    it('should return true after threshold time without activity', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      vi.advanceTimersByTime(299);
      expect(detector.checkStability(300)).toBe(false);

      vi.advanceTimersByTime(1);
      expect(detector.checkStability(300)).toBe(true);
    });

    it('should use default threshold (300ms)', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      // Phase 83.4 - Adaptive Threshold: scroll은 200ms 사용
      vi.advanceTimersByTime(199);
      expect(detector.checkStability()).toBe(false);

      vi.advanceTimersByTime(1);
      expect(detector.checkStability()).toBe(true);
    });

    it('should reset stability on new activity', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      vi.advanceTimersByTime(350); // > 300ms
      expect(detector.checkStability(300)).toBe(true);

      detector.recordActivity('focus');
      expect(detector.checkStability(300)).toBe(false);
    });

    it('should handle custom thresholds', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      vi.advanceTimersByTime(150);
      expect(detector.checkStability(150)).toBe(true);
      expect(detector.checkStability(200)).toBe(false);
    });
  });

  describe('상태 변화 콜백', () => {
    it('should call callback on stability change', () => {
      const callback = vi.fn();
      detector.onStabilityChange(callback);

      vi.setSystemTime(0);
      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledWith(false);

      vi.advanceTimersByTime(300);
      // checkStability 호출 필요 (자동 감지 아님)
      detector.checkStability();
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should not call callback if stability state unchanged', () => {
      const callback = vi.fn();
      vi.setSystemTime(100);
      detector.onStabilityChange(callback);

      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledTimes(1); // unstable 전환

      detector.recordActivity('focus');
      expect(callback).toHaveBeenCalledTimes(1); // 이미 unstable이므로 호출 안됨

      vi.setSystemTime(500);
      detector.checkStability();
      expect(callback).toHaveBeenCalledTimes(2); // stable 전환 시 호출
    });

    it('should unsubscribe callback when dispose is called', () => {
      const callback = vi.fn();
      const unsubscribe = detector.onStabilityChange(callback);

      detector.recordActivity('scroll');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      detector.recordActivity('focus');
      expect(callback).toHaveBeenCalledTimes(1); // 호출되지 않음
    });

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      detector.onStabilityChange(callback1);
      detector.onStabilityChange(callback2);

      detector.recordActivity('scroll');

      expect(callback1).toHaveBeenCalledWith(false);
      expect(callback2).toHaveBeenCalledWith(false);
    });
  });

  describe('메트릭 조회', () => {
    it('should return correct metrics', () => {
      vi.setSystemTime(1000);
      detector.recordActivity('scroll');

      vi.advanceTimersByTime(50);
      detector.recordActivity('focus');

      const metrics = detector.getMetrics();

      expect(metrics.totalActivities).toBe(2);
      expect(metrics.lastActivityType).toBe('focus');
      expect(metrics.lastActivityTime).toBe(1050);
      expect(metrics.isStable).toBe(false);
    });

    it('should track activity count by type', () => {
      detector.recordActivity('scroll');
      detector.recordActivity('scroll');
      detector.recordActivity('focus');
      detector.recordActivity('programmatic');

      const metrics = detector.getMetrics();
      expect(metrics.activityByType).toEqual({
        scroll: 2,
        focus: 1,
        layout: 0,
        programmatic: 1,
      });
    });
  });

  describe('엣지 케이스', () => {
    it('should handle rapid activity recording', () => {
      for (let i = 0; i < 100; i++) {
        detector.recordActivity('scroll');
        vi.advanceTimersByTime(1);
      }

      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(100);
      expect(metrics.isStable).toBe(false);
    });

    it('should handle long idle period', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      vi.advanceTimersByTime(10000); // 10초
      expect(detector.checkStability(300)).toBe(true);
    });

    it('should reset on clear', () => {
      detector.recordActivity('scroll');
      expect(detector.isStable()).toBe(false);

      detector.clear();
      expect(detector.isStable()).toBe(true);
      expect(detector.lastActivityTime()).toBe(0);
      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(0);
    });
  });

  describe('상태 신호 (Signal)', () => {
    it('should provide isStable signal', () => {
      expect(detector.isStable()).toBe(true);

      detector.recordActivity('scroll');
      expect(detector.isStable()).toBe(false);

      vi.advanceTimersByTime(300);
      detector.checkStability();
      expect(detector.isStable()).toBe(true);
    });

    it('should provide lastActivityTime signal', () => {
      expect(detector.lastActivityTime()).toBe(0);

      vi.setSystemTime(1500);
      detector.recordActivity('scroll');
      expect(detector.lastActivityTime()).toBe(1500);
    });
  });

  describe('확장 테스트 - Adaptive Threshold (Phase A5.5)', () => {
    it('should use userScrollThreshold for scroll-only activity', () => {
      const customDetector = createStabilityDetector({ userScrollThreshold: 100 });
      vi.setSystemTime(0);

      customDetector.recordActivity('scroll');
      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(99);
      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(1);
      expect(customDetector.checkStability()).toBe(true);

      customDetector.clear();
    });

    it('should use programmaticThreshold for programmatic activity', () => {
      const customDetector = createStabilityDetector({
        programmaticThreshold: 150,
      });
      vi.setSystemTime(0);

      customDetector.recordActivity('programmatic');
      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(149);
      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(1);
      expect(customDetector.checkStability()).toBe(true);

      customDetector.clear();
    });

    it('should use mixedThreshold when multiple activity types present', () => {
      const customDetector = createStabilityDetector({ mixedThreshold: 200 });
      vi.setSystemTime(0);

      customDetector.recordActivity('scroll');
      customDetector.recordActivity('focus');

      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(199);
      expect(customDetector.checkStability()).toBe(false);

      vi.advanceTimersByTime(1);
      expect(customDetector.checkStability()).toBe(true);

      customDetector.clear();
    });
  });

  describe('확장 테스트 - 상태 변화 알림', () => {
    it('should notify listeners on stability state change', () => {
      const listener = vi.fn();
      const unsubscribe = detector.onStabilityChange(listener);

      detector.recordActivity('scroll');
      expect(listener).toHaveBeenCalledWith(false);

      vi.advanceTimersByTime(300);
      detector.checkStability();
      expect(listener).toHaveBeenCalledWith(true);

      unsubscribe();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      detector.onStabilityChange(listener1);
      detector.onStabilityChange(listener2);

      detector.recordActivity('scroll');
      expect(listener1).toHaveBeenCalledWith(false);
      expect(listener2).toHaveBeenCalledWith(false);
    });

    it('should not notify after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = detector.onStabilityChange(listener);

      unsubscribe();
      detector.recordActivity('scroll');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Test error');
      });

      const safeListener = vi.fn();
      detector.onStabilityChange(errorListener);
      detector.onStabilityChange(safeListener);

      expect(() => {
        detector.recordActivity('scroll');
      }).not.toThrow();

      expect(errorListener).toHaveBeenCalled();
      expect(safeListener).toHaveBeenCalled();
    });
  });

  describe('확장 테스트 - 독립적 인스턴스 (Factory Pattern)', () => {
    it('should create independent instances', () => {
      const detector1 = createStabilityDetector();
      const detector2 = createStabilityDetector();

      detector1.recordActivity('scroll');
      detector2.recordActivity('focus');

      expect(detector1.getMetrics().lastActivityType).toBe('scroll');
      expect(detector2.getMetrics().lastActivityType).toBe('focus');

      detector1.clear();
      detector2.clear();
    });

    it('should not affect other instances on state change', () => {
      const detector1 = createStabilityDetector();
      const detector2 = createStabilityDetector();

      detector1.recordActivity('scroll');
      expect(detector1.isStable()).toBe(false);
      expect(detector2.isStable()).toBe(true);

      detector1.clear();
      detector2.clear();
    });
  });

  describe('확장 테스트 - 타이머 관리', () => {
    it('should clean up timers on clear', () => {
      detector.recordActivity('scroll');
      const timerCountBefore = vi.getTimerCount();
      expect(timerCountBefore).toBeGreaterThan(0);

      detector.clear();
      expect(vi.getTimerCount()).toBe(0);
    });

    it('should not leak timers on rapid activity', () => {
      for (let i = 0; i < 50; i++) {
        detector.recordActivity('scroll');
      }

      detector.clear();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('확장 테스트 - Edge Cases', () => {
    it('should handle zero-time threshold', () => {
      vi.setSystemTime(0);
      detector.recordActivity('scroll');

      // With 0ms threshold, should be stable immediately
      expect(detector.checkStability(0)).toBe(true);
    });

    it('should handle rapid state changes', () => {
      const listener = vi.fn();
      detector.onStabilityChange(listener);

      detector.recordActivity('scroll');
      expect(listener).toHaveBeenCalledWith(false);

      vi.advanceTimersByTime(300);
      detector.checkStability();
      expect(listener).toHaveBeenCalledWith(true);

      detector.recordActivity('focus');
      expect(listener).toHaveBeenCalledWith(false);

      vi.advanceTimersByTime(300);
      detector.checkStability();
      expect(listener).toHaveBeenCalledWith(true);

      expect(listener).toHaveBeenCalledTimes(4);
    });

    it('should handle large activity counts', () => {
      for (let i = 0; i < 100; i++) {
        detector.recordActivity('scroll');
      }

      const metrics = detector.getMetrics();
      expect(metrics.totalActivities).toBe(100);
      expect(metrics.activityByType.scroll).toBe(100);

      detector.clear();
    });
  });
});
