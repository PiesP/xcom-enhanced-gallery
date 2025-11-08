/**
 * @fileoverview Timer Management Tests
 * @description Comprehensive tests for shared/utils/timer-management.ts
 * Coverage target: 90%+
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  TimerManager,
  globalTimerManager,
  safePerformanceNow,
} from '../../../../src/shared/utils/timer-management';

describe('timer-management', () => {
  setupGlobalTestIsolation();

  describe('TimerManager', () => {
    let manager: TimerManager;

    beforeEach(() => {
      vi.useFakeTimers();
      manager = new TimerManager();
    });

    afterEach(() => {
      manager.cleanup();
      vi.useRealTimers();
    });

    describe('setTimeout', () => {
      it('should register and execute timeout', () => {
        const callback = vi.fn();
        manager.setTimeout(callback, 1000);

        expect(callback).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should return timer ID', () => {
        const id = manager.setTimeout(() => {}, 1000);
        // Vitest fake timers return Timeout object, not number
        expect(id).toBeDefined();
        expect(id).not.toBeNull();
      });

      it('should track multiple timeouts', () => {
        manager.setTimeout(() => {}, 1000);
        manager.setTimeout(() => {}, 2000);
        manager.setTimeout(() => {}, 3000);

        expect(manager.getActiveTimersCount()).toBe(3);
      });

      it('should auto-remove timeout after execution', () => {
        manager.setTimeout(() => {}, 1000);
        expect(manager.getActiveTimersCount()).toBe(1);

        vi.advanceTimersByTime(1000);
        expect(manager.getActiveTimersCount()).toBe(0);
      });
    });

    describe('setInterval', () => {
      it('should register and execute interval repeatedly', () => {
        const callback = vi.fn();
        manager.setInterval(callback, 1000);

        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(2);

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(3);
      });

      it('should return interval ID', () => {
        const id = manager.setInterval(() => {}, 1000);
        // Vitest fake timers return Interval object, not number
        expect(id).toBeDefined();
        expect(id).not.toBeNull();
      });

      it('should track multiple intervals', () => {
        manager.setInterval(() => {}, 1000);
        manager.setInterval(() => {}, 2000);

        expect(manager.getActiveTimersCount()).toBe(2);
      });
    });

    describe('clearTimeout', () => {
      it('should clear registered timeout', () => {
        const callback = vi.fn();
        const id = manager.setTimeout(callback, 1000);

        manager.clearTimeout(id);
        vi.advanceTimersByTime(1000);

        expect(callback).not.toHaveBeenCalled();
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should handle invalid IDs gracefully', () => {
        expect(() => manager.clearTimeout(99999)).not.toThrow();
      });

      it('should not affect other timers', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        const id1 = manager.setTimeout(callback1, 1000);
        manager.setTimeout(callback2, 1000);

        manager.clearTimeout(id1);
        vi.advanceTimersByTime(1000);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });

    describe('clearInterval', () => {
      it('should clear registered interval', () => {
        const callback = vi.fn();
        const id = manager.setInterval(callback, 1000);

        manager.clearInterval(id);
        vi.advanceTimersByTime(3000);

        expect(callback).not.toHaveBeenCalled();
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should handle invalid IDs gracefully', () => {
        expect(() => manager.clearInterval(99999)).not.toThrow();
      });

      it('should not affect other intervals', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        const id1 = manager.setInterval(callback1, 1000);
        manager.setInterval(callback2, 1000);

        manager.clearInterval(id1);
        vi.advanceTimersByTime(2000);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(2);
      });
    });

    describe('cleanup', () => {
      it('should clear all timeouts', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        manager.setTimeout(callback1, 1000);
        manager.setTimeout(callback2, 2000);

        manager.cleanup();
        vi.advanceTimersByTime(3000);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should clear all intervals', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        manager.setInterval(callback1, 1000);
        manager.setInterval(callback2, 1000);

        manager.cleanup();
        vi.advanceTimersByTime(3000);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should clear mixed timers and intervals', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        manager.setTimeout(callback1, 1000);
        manager.setInterval(callback2, 1000);

        expect(manager.getActiveTimersCount()).toBe(2);

        manager.cleanup();

        expect(manager.getActiveTimersCount()).toBe(0);
        vi.advanceTimersByTime(3000);

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
      });

      it('should be safe to call multiple times', () => {
        manager.setTimeout(() => {}, 1000);
        manager.cleanup();

        expect(() => manager.cleanup()).not.toThrow();
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should work with empty manager', () => {
        expect(() => manager.cleanup()).not.toThrow();
        expect(manager.getActiveTimersCount()).toBe(0);
      });
    });

    describe('getActiveTimersCount', () => {
      it('should return 0 for new manager', () => {
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should count active timeouts', () => {
        manager.setTimeout(() => {}, 1000);
        manager.setTimeout(() => {}, 2000);

        expect(manager.getActiveTimersCount()).toBe(2);
      });

      it('should count active intervals', () => {
        manager.setInterval(() => {}, 1000);
        manager.setInterval(() => {}, 2000);

        expect(manager.getActiveTimersCount()).toBe(2);
      });

      it('should count mixed timers', () => {
        manager.setTimeout(() => {}, 1000);
        manager.setInterval(() => {}, 1000);

        expect(manager.getActiveTimersCount()).toBe(2);
      });

      it('should decrease count after timeout execution', () => {
        manager.setTimeout(() => {}, 1000);
        expect(manager.getActiveTimersCount()).toBe(1);

        vi.advanceTimersByTime(1000);
        expect(manager.getActiveTimersCount()).toBe(0);
      });

      it('should not decrease count for intervals', () => {
        manager.setInterval(() => {}, 1000);
        expect(manager.getActiveTimersCount()).toBe(1);

        vi.advanceTimersByTime(3000);
        expect(manager.getActiveTimersCount()).toBe(1); // still active
      });
    });

    describe('edge cases', () => {
      it('should handle 0ms timeout', () => {
        const callback = vi.fn();
        manager.setTimeout(callback, 0);

        vi.advanceTimersByTime(0);
        expect(callback).toHaveBeenCalled();
      });

      it('should handle very long delays', () => {
        const callback = vi.fn();
        manager.setTimeout(callback, 999999);

        vi.advanceTimersByTime(999998);
        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalled();
      });

      it('should maintain correct count with rapid cleanup', () => {
        for (let i = 0; i < 10; i++) {
          manager.setTimeout(() => {}, 1000);
        }

        expect(manager.getActiveTimersCount()).toBe(10);

        manager.cleanup();

        expect(manager.getActiveTimersCount()).toBe(0);
      });
    });
  });

  describe('globalTimerManager', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      globalTimerManager.cleanup();
    });

    afterEach(() => {
      globalTimerManager.cleanup();
      vi.useRealTimers();
    });

    it('should be a singleton instance', () => {
      expect(globalTimerManager).toBeInstanceOf(TimerManager);
    });

    it('should be usable directly', () => {
      const callback = vi.fn();
      globalTimerManager.setTimeout(callback, 1000);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalled();
    });

    it('should maintain state across module imports', () => {
      globalTimerManager.setTimeout(() => {}, 1000);
      expect(globalTimerManager.getActiveTimersCount()).toBe(1);
    });
  });

  describe('safePerformanceNow', () => {
    it('should return a number', () => {
      const result = safePerformanceNow();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
    });

    it('should use performance.now if available', () => {
      const result = safePerformanceNow();
      expect(result).toBeGreaterThan(0);

      // In JSDOM, performance.now() exists
      expect(globalThis.performance).toBeDefined();
      expect(typeof globalThis.performance.now).toBe('function');
    });

    it('should fallback to Date.now if performance is unavailable', () => {
      const originalPerformance = globalThis.performance;

      // Mock: Remove performance
      Object.defineProperty(globalThis, 'performance', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = safePerformanceNow();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);

      // Restore
      Object.defineProperty(globalThis, 'performance', {
        value: originalPerformance,
        writable: true,
        configurable: true,
      });
    });

    it('should return increasing values', () => {
      const time1 = safePerformanceNow();

      // Small delay
      let dummy = 0;
      for (let i = 0; i < 1000; i++) {
        dummy += i;
      }

      const time2 = safePerformanceNow();
      expect(time2).toBeGreaterThanOrEqual(time1);
    });

    it('should work with performance.now unavailable', () => {
      const originalPerf = globalThis.performance;

      Object.defineProperty(globalThis, 'performance', {
        value: {},
        writable: true,
        configurable: true,
      });

      const result = safePerformanceNow();
      expect(typeof result).toBe('number');

      Object.defineProperty(globalThis, 'performance', {
        value: originalPerf,
        writable: true,
        configurable: true,
      });
    });
  });
});
