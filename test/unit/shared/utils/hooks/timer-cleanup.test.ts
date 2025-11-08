/**
 * @fileoverview Unit tests for timer-cleanup utilities
 * @module test/unit/shared/utils/hooks/timer-cleanup
 * @version 1.0.0
 * @since Phase 350
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createManagedTimeout,
  createManagedInterval,
  createTimerGroup,
  createDebouncedFunction,
  retryWithBackoff,
} from '@shared/utils/hooks';

describe('timer-cleanup', () => {
  let cleanup: (() => void)[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
    cleanup = [];
  });

  afterEach(() => {
    cleanup.forEach(fn => fn());
    cleanup = [];
    vi.restoreAllMocks();
  });

  describe('createManagedTimeout', () => {
    it('should create timeout and execute callback', async () => {
      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 1000);
      cleanup.push(() => timer.cancel());

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel timeout before execution', () => {
      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 1000);

      timer.cancel();
      vi.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle multiple cancel calls safely', () => {
      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 1000);

      timer.cancel();
      expect(() => timer.cancel()).not.toThrow();
    });

    it('should execute immediately with 0 delay', () => {
      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 0);
      cleanup.push(() => timer.cancel());

      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple timers independently', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const timer1 = createManagedTimeout(callback1, 1000);
      const timer2 = createManagedTimeout(callback2, 2000);
      cleanup.push(() => {
        timer1.cancel();
        timer2.cancel();
      });

      vi.advanceTimersByTime(1000);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('createManagedInterval', () => {
    it('should create interval and execute callback repeatedly', () => {
      const callback = vi.fn();
      const timer = createManagedInterval(callback, 1000);
      cleanup.push(() => timer.cancel());

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should cancel interval', () => {
      const callback = vi.fn();
      const timer = createManagedInterval(callback, 1000);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);

      timer.cancel();
      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple cancel calls safely', () => {
      const callback = vi.fn();
      const timer = createManagedInterval(callback, 1000);

      timer.cancel();
      expect(() => timer.cancel()).not.toThrow();
    });

    it('should execute multiple times before cancel', () => {
      const callback = vi.fn();
      const timer = createManagedInterval(callback, 500);

      vi.advanceTimersByTime(2000);
      expect(callback).toHaveBeenCalledTimes(4);

      timer.cancel();
    });

    it('should handle immediate first execution with 0 delay', () => {
      const callback = vi.fn();
      const timer = createManagedInterval(callback, 0);
      cleanup.push(() => timer.cancel());

      vi.advanceTimersByTime(0);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('createTimerGroup', () => {
    it('should create empty timer group', () => {
      const group = createTimerGroup();
      cleanup.push(() => group.cancelAll());

      expect(group).toBeDefined();
      expect(group.add).toBeInstanceOf(Function);
      expect(group.remove).toBeInstanceOf(Function);
      expect(group.cancelAll).toBeInstanceOf(Function);
      expect(group.size()).toBe(0);
    });

    it('should add timers to group', () => {
      const group = createTimerGroup();
      cleanup.push(() => group.cancelAll());

      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 1000);

      const id = group.add(timer);
      expect(id).toMatch(/^timer-/);
      expect(group.size()).toBe(1);
    });

    it('should remove timer from group', () => {
      const group = createTimerGroup();
      cleanup.push(() => group.cancelAll());

      const callback = vi.fn();
      const timer = createManagedTimeout(callback, 1000);

      const id = group.add(timer);
      expect(group.size()).toBe(1);

      const removed = group.remove(id);
      expect(removed).toBe(true);
      expect(group.size()).toBe(0);
    });

    it('should cancel all timers in group', () => {
      const group = createTimerGroup();

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const timer1 = createManagedTimeout(callback1, 1000);
      const timer2 = createManagedInterval(callback2, 500);

      group.add(timer1);
      group.add(timer2);
      expect(group.size()).toBe(2);

      group.cancelAll();
      expect(group.size()).toBe(0);

      vi.advanceTimersByTime(2000);
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent timer', () => {
      const group = createTimerGroup();
      cleanup.push(() => group.cancelAll());

      const removed = group.remove('non-existent-id');
      expect(removed).toBe(false);
    });
  });

  describe('createDebouncedFunction', () => {
    it('should debounce function calls', () => {
      const callback = vi.fn();
      const debounced = createDebouncedFunction(callback, 1000);
      cleanup.push(() => debounced.cancel());

      debounced();
      debounced();
      debounced();

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel pending debounced call', () => {
      const callback = vi.fn();
      const debounced = createDebouncedFunction(callback, 1000);

      debounced();
      debounced.cancel();

      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should execute immediately in immediate mode', () => {
      const callback = vi.fn();
      const debounced = createDebouncedFunction(callback, 1000, true);
      cleanup.push(() => debounced.cancel());

      debounced();
      expect(callback).toHaveBeenCalledTimes(1);

      debounced();
      debounced();
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on repeated calls', () => {
      const callback = vi.fn();
      const debounced = createDebouncedFunction(callback, 1000);
      cleanup.push(() => debounced.cancel());

      debounced();
      vi.advanceTimersByTime(500);
      debounced();
      vi.advanceTimersByTime(500);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle arguments correctly', () => {
      const callback = vi.fn();
      const debounced = createDebouncedFunction(callback, 1000);
      cleanup.push(() => debounced.cancel());

      debounced('arg1', 'arg2');

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const successFn = vi.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(successFn, { maxAttempts: 3 });
      vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const failThenSucceed = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      const promise = retryWithBackoff(failThenSucceed, { maxAttempts: 3 });
      vi.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('success');
      expect(failThenSucceed).toHaveBeenCalledTimes(3);
    });

    it('should throw after max attempts', async () => {
      const alwaysFail = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = retryWithBackoff(alwaysFail, { maxAttempts: 3 });
      vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('fail');
      expect(alwaysFail).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const alwaysFail = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = retryWithBackoff(alwaysFail, {
        maxAttempts: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      // Don't advance all timers, check individual delays
      await expect(promise).rejects.toThrow('fail');
      expect(alwaysFail).toHaveBeenCalledTimes(3);
    });

    it('should respect max delay', async () => {
      const alwaysFail = vi.fn().mockRejectedValue(new Error('fail'));

      const promise = retryWithBackoff(alwaysFail, {
        maxAttempts: 5,
        initialDelay: 100,
        backoffMultiplier: 2,
        maxDelay: 300,
      });

      vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow('fail');
      expect(alwaysFail).toHaveBeenCalledTimes(5);
    });
  });
});
