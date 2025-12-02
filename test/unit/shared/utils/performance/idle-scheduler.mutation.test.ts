/**
 * @fileoverview Additional mutation tests for idle-scheduler
 * @description Edge cases for requestIdleCallback and timer fallback paths
 */

import { scheduleIdle } from '@shared/utils/performance/idle-scheduler';
import { globalTimerManager } from '@shared/utils/time/timer-management';

describe('idle-scheduler mutation edge cases', () => {
  let originalRIC: unknown;
  let originalCIC: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    originalRIC = (globalThis as Record<string, unknown>).requestIdleCallback;
    originalCIC = (globalThis as Record<string, unknown>).cancelIdleCallback;
    vi.spyOn(globalTimerManager, 'setTimeout');
    vi.spyOn(globalTimerManager, 'clearTimeout');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalRIC !== undefined) {
      (globalThis as Record<string, unknown>).requestIdleCallback = originalRIC;
    } else {
      delete (globalThis as Record<string, unknown>).requestIdleCallback;
    }
    if (originalCIC !== undefined) {
      (globalThis as Record<string, unknown>).cancelIdleCallback = originalCIC;
    } else {
      delete (globalThis as Record<string, unknown>).cancelIdleCallback;
    }
  });

  describe('getIdleAPIs edge cases', () => {
    it('should handle when globalThis is undefined-like', () => {
      // Simulate environment without proper globalThis
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;
      (globalThis as Record<string, unknown>).cancelIdleCallback = undefined;

      const task = vi.fn();
      scheduleIdle(task);

      // Should fallback to timer manager
      expect(globalTimerManager.setTimeout).toHaveBeenCalled();
    });

    it('should use requestIdleCallback when it returns a function', () => {
      const ricMock = vi.fn(() => 123);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = vi.fn();

      const task = vi.fn();
      scheduleIdle(task);

      expect(ricMock).toHaveBeenCalled();
    });
  });

  describe('Alternative RIC not function test', () => {
    it('should use timer fallback when RIC returns non-callable', () => {
      // Set up RIC as non-existent
      delete (globalThis as Record<string, unknown>).requestIdleCallback;

      const task = vi.fn();
      scheduleIdle(task);

      expect(globalTimerManager.setTimeout).toHaveBeenCalled();
    });
  });

  describe('Task execution with requestIdleCallback', () => {
    it('should execute task synchronously when RIC calls callback immediately', () => {
      const task = vi.fn();
      const ricMock = vi.fn((cb: () => void) => {
        cb();
        return 123;
      });
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = vi.fn();

      scheduleIdle(task);

      expect(task).toHaveBeenCalled();
    });

    it('should not throw when task throws error in RIC callback', () => {
      const task = vi.fn(() => {
        throw new Error('Task error');
      });
      const ricMock = vi.fn((cb: () => void) => {
        cb();
        return 123;
      });
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = vi.fn();

      expect(() => scheduleIdle(task)).not.toThrow();
      expect(task).toHaveBeenCalled();
    });
  });

  describe('Task execution with setTimeout fallback', () => {
    it('should execute task after timer fires', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      const task = vi.fn();
      scheduleIdle(task);

      expect(task).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(task).toHaveBeenCalled();
    });

    it('should not throw when task throws error in setTimeout callback', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      const task = vi.fn(() => {
        throw new Error('Task error');
      });
      scheduleIdle(task);

      expect(() => vi.runAllTimers()).not.toThrow();
      expect(task).toHaveBeenCalled();
    });
  });

  describe('Cancel behavior with requestIdleCallback', () => {
    it('should call cancelIdleCallback with correct id on cancel', () => {
      const cicMock = vi.fn();
      const ricMock = vi.fn(() => 456);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = cicMock;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      handle.cancel();

      expect(cicMock).toHaveBeenCalledWith(456);
    });

    it('should not throw when cancelIdleCallback is null', () => {
      const ricMock = vi.fn(() => 789);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = null;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      expect(() => handle.cancel()).not.toThrow();
    });

    it('should not throw when cancelIdleCallback is undefined', () => {
      const ricMock = vi.fn(() => 999);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = undefined;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      expect(() => handle.cancel()).not.toThrow();
    });
  });

  describe('Cancel behavior with setTimeout fallback', () => {
    it('should call clearTimeout with correct id on cancel', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      vi.mocked(globalTimerManager.setTimeout).mockReturnValue(12345);

      const task = vi.fn();
      const handle = scheduleIdle(task);

      handle.cancel();

      expect(globalTimerManager.clearTimeout).toHaveBeenCalledWith(12345);
    });

    it('should prevent task execution when cancelled before timer fires', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      handle.cancel();
      vi.runAllTimers();

      expect(task).not.toHaveBeenCalled();
    });
  });

  describe('Multiple schedules', () => {
    it('should handle multiple concurrent schedules with RIC', () => {
      let callbackId = 1;
      const callbacks: Map<number, () => void> = new Map();

      const ricMock = vi.fn((cb: () => void) => {
        const id = callbackId++;
        callbacks.set(id, cb);
        return id;
      });
      const cicMock = vi.fn((id: number) => {
        callbacks.delete(id);
      });

      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = cicMock;

      const task1 = vi.fn();
      const task2 = vi.fn();
      const task3 = vi.fn();

      scheduleIdle(task1);
      const handle2 = scheduleIdle(task2);
      scheduleIdle(task3);

      // Cancel task2
      handle2.cancel();

      // Execute remaining callbacks
      callbacks.forEach((cb) => cb());

      expect(task1).toHaveBeenCalled();
      expect(task2).not.toHaveBeenCalled();
      expect(task3).toHaveBeenCalled();
    });

    it('should handle multiple concurrent schedules with fallback', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      const task1 = vi.fn();
      const task2 = vi.fn();

      scheduleIdle(task1);
      scheduleIdle(task2);

      vi.runAllTimers();

      expect(task1).toHaveBeenCalled();
      expect(task2).toHaveBeenCalled();
    });
  });

  describe('Return value structure', () => {
    it('should return object with cancel function when using RIC', () => {
      const ricMock = vi.fn(() => 1);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = vi.fn();

      const task = vi.fn();
      const handle = scheduleIdle(task);

      expect(handle).toBeDefined();
      expect(typeof handle.cancel).toBe('function');
    });

    it('should return object with cancel function when using fallback', () => {
      (globalThis as Record<string, unknown>).requestIdleCallback = undefined;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      expect(handle).toBeDefined();
      expect(typeof handle.cancel).toBe('function');
    });
  });

  describe('Edge case: RIC returns 0', () => {
    it('should handle when RIC returns 0 as valid handle id', () => {
      const cicMock = vi.fn();
      const ricMock = vi.fn(() => 0);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;
      (globalThis as Record<string, unknown>).cancelIdleCallback = cicMock;

      const task = vi.fn();
      const handle = scheduleIdle(task);

      handle.cancel();

      expect(cicMock).toHaveBeenCalledWith(0);
    });
  });

  describe('globalThis check', () => {
    it('should work correctly when source object check passes', () => {
      const ricMock = vi.fn(() => 42);
      (globalThis as Record<string, unknown>).requestIdleCallback = ricMock;

      const task = vi.fn();
      scheduleIdle(task);

      expect(ricMock).toHaveBeenCalled();
    });
  });
});
