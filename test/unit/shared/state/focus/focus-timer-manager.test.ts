import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  FocusTimerManager,
  createFocusTimerManager,
  type FocusTimerRole,
} from '@shared/state/focus/focus-timer-manager';

describe('Focus Timer Manager (Phase 150.2 Step 3)', () => {
  setupGlobalTestIsolation();

  let manager: FocusTimerManager;

  beforeEach(() => {
    manager = createFocusTimerManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    manager.dispose();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  describe('FocusTimerManager Basic Operations', () => {
    it('should initialize with no active timers', () => {
      expect(manager.size).toBe(0);
      expect(manager.getAllTimers()).toHaveLength(0);
    });

    it('should set a timer with callback', () => {
      const callback = vi.fn();
      const timerId = manager.setTimer('auto-focus', callback, 100);

      expect(timerId).toBeDefined();
      expect(manager.size).toBe(1);
      expect(manager.hasTimer('auto-focus')).toBe(true);
    });

    it('should execute timer callback after delay', () => {
      const callback = vi.fn();
      manager.setTimer('auto-focus', callback, 100);

      vi.advanceTimersByTime(99);
      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should remove timer after execution', () => {
      const callback = vi.fn();
      manager.setTimer('auto-focus', callback, 100);

      vi.advanceTimersByTime(100);

      expect(manager.size).toBe(0);
      expect(manager.hasTimer('auto-focus')).toBe(false);
    });

    it('should handle multiple timers with different roles', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 150);
      manager.setTimer('flush-batch', callback3, 50);

      expect(manager.size).toBe(3);
      expect(manager.hasTimer('auto-focus')).toBe(true);
      expect(manager.hasTimer('recompute')).toBe(true);
      expect(manager.hasTimer('flush-batch')).toBe(true);

      vi.advanceTimersByTime(50);
      expect(callback3).toHaveBeenCalledOnce();
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(manager.size).toBe(2);

      vi.advanceTimersByTime(50);
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).not.toHaveBeenCalled();
      expect(manager.size).toBe(1);

      vi.advanceTimersByTime(50);
      expect(callback2).toHaveBeenCalledOnce();
      expect(manager.size).toBe(0);
    });
  });

  describe('Timer Clearing', () => {
    it('should clear specific timer by role', () => {
      const callback = vi.fn();
      manager.setTimer('auto-focus', callback, 100);

      expect(manager.hasTimer('auto-focus')).toBe(true);

      manager.clearTimer('auto-focus');

      expect(manager.hasTimer('auto-focus')).toBe(false);
      expect(manager.size).toBe(0);

      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should clear all timers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 150);
      manager.setTimer('flush-batch', callback3, 50);

      expect(manager.size).toBe(3);

      manager.clearAll();

      expect(manager.size).toBe(0);
      expect(manager.getAllTimers()).toHaveLength(0);

      vi.advanceTimersByTime(200);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should clear non-existent timer safely', () => {
      expect(() => {
        manager.clearTimer('auto-focus');
      }).not.toThrow();

      expect(manager.size).toBe(0);
    });
  });

  describe('Timer Replacement', () => {
    it('should replace existing timer of same role', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      expect(manager.size).toBe(1);

      manager.setTimer('auto-focus', callback2, 100);
      expect(manager.size).toBe(1); // Still 1, not 2

      vi.advanceTimersByTime(100);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledOnce();
    });

    it('should allow different timers for different roles', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 100);

      expect(manager.size).toBe(2);

      vi.advanceTimersByTime(100);
      expect(callback1).toHaveBeenCalledOnce();
      expect(callback2).toHaveBeenCalledOnce();
    });
  });

  describe('Timer Information', () => {
    it('should retrieve timer by role', () => {
      const callback = vi.fn();
      manager.setTimer('auto-focus', callback, 100);

      const timer = manager.getTimer('auto-focus');
      expect(timer).toBeDefined();
      expect(timer?.role).toBe('auto-focus');
      expect(timer?.delay).toBe(100);
    });

    it('should return undefined for non-existent timer', () => {
      const timer = manager.getTimer('auto-focus');
      expect(timer).toBeUndefined();
    });

    it('should get all active timers', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 150);

      const allTimers = manager.getAllTimers();
      expect(allTimers).toHaveLength(2);
      expect(allTimers.map(t => t.role)).toContain('auto-focus');
      expect(allTimers.map(t => t.role)).toContain('recompute');
    });
  });

  describe('Time Tracking', () => {
    it('should calculate elapsed time', () => {
      manager.setTimer('auto-focus', () => {}, 1000);

      vi.advanceTimersByTime(250);
      const elapsed = manager.getElapsedTime('auto-focus');
      expect(elapsed).toBeGreaterThanOrEqual(250);
      expect(elapsed).toBeLessThan(300);
    });

    it('should calculate remaining time', () => {
      manager.setTimer('auto-focus', () => {}, 1000);

      vi.advanceTimersByTime(250);
      const remaining = manager.getRemainingTime('auto-focus');
      expect(remaining).toBeGreaterThan(700);
      expect(remaining).toBeLessThanOrEqual(750);
    });

    it('should return 0 time for non-existent timer', () => {
      expect(manager.getElapsedTime('auto-focus')).toBe(0);
      expect(manager.getRemainingTime('auto-focus')).toBe(0);
    });

    it('should return 0 remaining time after timer execution', () => {
      manager.setTimer('auto-focus', () => {}, 100);

      vi.advanceTimersByTime(100);
      expect(manager.getRemainingTime('auto-focus')).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', () => {
      const callback = vi.fn(() => {
        throw new Error('Test error');
      });

      manager.setTimer('auto-focus', callback, 100);

      expect(() => {
        vi.advanceTimersByTime(100);
      }).not.toThrow();

      // Timer should be removed even after error
      expect(manager.size).toBe(0);
    });
  });

  describe('Debug Information', () => {
    it('should provide debug info', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 150);

      vi.advanceTimersByTime(50);

      const debugInfo = manager.getDebugInfo();
      expect(debugInfo.activeTimers).toBe(2);
      expect(debugInfo.timers).toHaveLength(2);
      expect(debugInfo.timers.every(t => t.elapsed >= 50)).toBe(true);
    });
  });

  describe('Disposal', () => {
    it('should clear all timers on dispose', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.setTimer('auto-focus', callback1, 100);
      manager.setTimer('recompute', callback2, 150);

      manager.dispose();

      expect(manager.size).toBe(0);

      vi.advanceTimersByTime(200);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should register and call disposers', () => {
      const disposer1 = vi.fn();
      const disposer2 = vi.fn();

      manager.registerDisposer(disposer1);
      manager.registerDisposer(disposer2);

      manager.dispose();

      expect(disposer1).toHaveBeenCalledOnce();
      expect(disposer2).toHaveBeenCalledOnce();
    });

    it('should handle disposer errors gracefully', () => {
      const disposer1 = vi.fn(() => {
        throw new Error('Disposer error');
      });
      const disposer2 = vi.fn();

      manager.registerDisposer(disposer1);
      manager.registerDisposer(disposer2);

      expect(() => {
        manager.dispose();
      }).not.toThrow();

      expect(disposer2).toHaveBeenCalledOnce();
    });
  });

  describe('FocusTimerManager Integration (Phase 150.2 consolidation)', () => {
    it('should consolidate multiple timer states into single manager', () => {
      // Previous approach (multiple state variables):
      // - autoFocusTimerId: number | null
      // - recomputeTimerId: number | null (separate)
      // - flushBatchTimerId: number | null (separate)

      // Consolidated approach:
      const autoFocusCallback = vi.fn();
      const recomputeCallback = vi.fn();
      const flushBatchCallback = vi.fn();

      manager.setTimer('auto-focus', autoFocusCallback, 100);
      manager.setTimer('recompute', recomputeCallback, 150);
      manager.setTimer('flush-batch', flushBatchCallback, 50);

      // Verify all timers are managed in single structure
      expect(manager.size).toBe(3);
      expect(manager.hasTimer('auto-focus')).toBe(true);
      expect(manager.hasTimer('recompute')).toBe(true);
      expect(manager.hasTimer('flush-batch')).toBe(true);

      // Verify individual control
      manager.clearTimer('auto-focus');
      expect(manager.size).toBe(2);
      expect(manager.hasTimer('auto-focus')).toBe(false);

      // Verify batch control
      manager.clearAll();
      expect(manager.size).toBe(0);
    });

    it('should simplify timer management compared to previous approach', () => {
      // Old approach required manual tracking of multiple timerId variables
      // and separate cleanup functions. New approach centralizes all:

      const callbacks = {
        autoFocus: vi.fn(),
        recompute: vi.fn(),
        flushBatch: vi.fn(),
      };

      // Single manager handles all timers
      Object.entries(callbacks).forEach(([role, callback]) => {
        const focusRole =
          role === 'autoFocus' ? 'auto-focus' : role === 'recompute' ? 'recompute' : 'flush-batch';
        manager.setTimer(focusRole as FocusTimerRole, callback, 100);
      });

      expect(manager.size).toBe(3);

      // Single dispose() clears everything
      manager.dispose();
      expect(manager.size).toBe(0);
    });
  });
});
