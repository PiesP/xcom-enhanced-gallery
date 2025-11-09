import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import {
  FocusTimerManager,
  createFocusTimerManager,
} from '@shared/state/focus/focus-timer-manager';

describe('FocusTimerManager', () => {
  setupGlobalTestIsolation();

  let manager: FocusTimerManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = createFocusTimerManager();
  });

  afterEach(() => {
    manager.clearAll();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('schedules a timer and runs it once', () => {
    const callback = vi.fn();
    manager.setTimer('auto-focus', callback, 50);

    expect(manager.hasTimer('auto-focus')).toBe(true);
    expect(manager.size).toBe(1);

    vi.advanceTimersByTime(49);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(manager.hasTimer('auto-focus')).toBe(false);
    expect(manager.size).toBe(0);
  });

  it('replaces an existing timer for the same role', () => {
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    manager.setTimer('auto-focus', firstCallback, 100);
    const secondId = manager.setTimer('auto-focus', secondCallback, 100);

    expect(secondId).toBeDefined();
    expect(firstCallback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(firstCallback).not.toHaveBeenCalled();
    expect(secondCallback).toHaveBeenCalledTimes(1);
    expect(manager.hasTimer('auto-focus')).toBe(false);
  });

  it('clears a pending timer', () => {
    const callback = vi.fn();

    manager.setTimer('auto-focus', callback, 100);
    manager.clearTimer('auto-focus');

    expect(manager.hasTimer('auto-focus')).toBe(false);
    expect(manager.size).toBe(0);

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it('clears all timers at once', () => {
    const callback = vi.fn();

    manager.setTimer('auto-focus', callback, 100);
    manager.clearAll();

    expect(manager.hasTimer('auto-focus')).toBe(false);
    expect(manager.size).toBe(0);

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it('handles callback errors without leaking state', () => {
    const failingCallback = vi.fn(() => {
      throw new Error('boom');
    });

    manager.setTimer('auto-focus', failingCallback, 10);

    expect(() => {
      vi.advanceTimersByTime(10);
    }).not.toThrow();

    expect(failingCallback).toHaveBeenCalledTimes(1);
    expect(manager.hasTimer('auto-focus')).toBe(false);
    expect(manager.size).toBe(0);
  });
});
