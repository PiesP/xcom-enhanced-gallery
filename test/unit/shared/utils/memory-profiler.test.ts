// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { scheduleIdle, scheduleMicrotask, scheduleRaf } from '@shared/utils/performance';
import { globalTimerManager } from '@shared/utils/timer-management';

describe('Performance schedulers', () => {
  setupGlobalTestIsolation();

  type FrameCallback = (timestamp: number) => void;

  const globalAny = globalThis as Record<string, any>;

  let originalIdleRequest: ((...args: any[]) => any) | undefined;
  let originalIdleCancel: ((...args: any[]) => any) | undefined;
  let originalRaf: typeof globalThis.requestAnimationFrame | undefined;
  let originalCancelRaf: typeof globalThis.cancelAnimationFrame | undefined;
  let originalQueueMicrotask: typeof globalThis.queueMicrotask | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    globalTimerManager.cleanup();

    originalIdleRequest = globalAny.requestIdleCallback;
    originalIdleCancel = globalAny.cancelIdleCallback;
    originalRaf = globalThis.requestAnimationFrame;
    originalCancelRaf = globalThis.cancelAnimationFrame;
    originalQueueMicrotask = globalThis.queueMicrotask;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalTimerManager.cleanup();
    if (originalIdleRequest) {
      globalAny.requestIdleCallback = originalIdleRequest;
    } else {
      delete globalAny.requestIdleCallback;
    }
    if (originalIdleCancel) {
      globalAny.cancelIdleCallback = originalIdleCancel;
    } else {
      delete globalAny.cancelIdleCallback;
    }
    if (originalRaf) {
      globalAny.requestAnimationFrame = originalRaf;
    } else {
      delete globalAny.requestAnimationFrame;
    }
    if (originalCancelRaf) {
      globalAny.cancelAnimationFrame = originalCancelRaf;
    } else {
      delete globalAny.cancelAnimationFrame;
    }
    if (originalQueueMicrotask) {
      globalAny.queueMicrotask = originalQueueMicrotask;
    } else {
      delete globalAny.queueMicrotask;
    }
  });

  it('scheduleIdle() falls back to tracked setTimeout when idle APIs are unavailable', () => {
    delete globalAny.requestIdleCallback;
    delete globalAny.cancelIdleCallback;

    const task = vi.fn();
    const handle = scheduleIdle(task);

    expect(task).not.toHaveBeenCalled();

    vi.runOnlyPendingTimers();
    expect(task).toHaveBeenCalledTimes(1);

    handle.cancel();
    expect(globalTimerManager.getActiveTimersCount()).toBe(0);
  });

  it('scheduleIdle() cancellation prevents fallback execution', () => {
    delete globalAny.requestIdleCallback;
    delete globalAny.cancelIdleCallback;

    const task = vi.fn();
    const handle = scheduleIdle(task);

    handle.cancel();
    vi.runOnlyPendingTimers();

    expect(task).not.toHaveBeenCalled();
    expect(globalTimerManager.getActiveTimersCount()).toBe(0);
  });

  it('scheduleRaf() uses requestAnimationFrame when available and clears fallback timer', () => {
    const rafCallbacks: FrameCallback[] = [];
    globalThis.requestAnimationFrame = vi.fn(cb => {
      rafCallbacks.push(cb);
      return 42;
    });
    globalThis.cancelAnimationFrame = vi.fn();

    const task = vi.fn();
    const handle = scheduleRaf(task);

    expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(task).not.toHaveBeenCalled();

    rafCallbacks[0](16);
    expect(task).toHaveBeenCalledTimes(1);

    handle.cancel();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(globalTimerManager.getActiveTimersCount()).toBe(0);
  });

  it('scheduleMicrotask() prefers queueMicrotask and runs synchronously in tests', () => {
    const qm = vi.fn((cb: () => void) => cb());
    globalThis.queueMicrotask = qm;

    const task = vi.fn();
    const handle = scheduleMicrotask(task);

    expect(qm).toHaveBeenCalledTimes(1);
    expect(task).toHaveBeenCalledTimes(1);
    handle.cancel();
  });

  it('scheduleMicrotask() falls back to Promise microtask when queueMicrotask is missing', async () => {
    delete globalAny.queueMicrotask;

    const task = vi.fn();
    const handle = scheduleMicrotask(task);

    await Promise.resolve();
    expect(task).toHaveBeenCalledTimes(1);

    handle.cancel();
  });
});
