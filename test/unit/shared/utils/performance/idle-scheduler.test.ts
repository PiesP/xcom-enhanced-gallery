import { scheduleIdle } from '@shared/utils/performance/idle-scheduler';
import { globalTimerManager } from '@shared/utils/time/timer-management';

describe('idle-scheduler', () => {
  beforeEach(() => {
    // Clear custom globals between tests
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
    vi.restoreAllMocks();
  });

  it('should use requestIdleCallback when available and cancel with cancelIdleCallback', () => {
    const id = 42;
    const rcb = vi.fn((cb: () => void) => {
      // call the callback immediately to simulate scheduling
      cb();
      return id;
    });
    const cic = vi.fn();

    (globalThis as any).requestIdleCallback = rcb;
    (globalThis as any).cancelIdleCallback = cic;

    const task = vi.fn();
    const handle = scheduleIdle(task);

    // task should have been executed synchronously by our mock
    expect(task).toHaveBeenCalled();

    // Cancel should call cancelIdleCallback
    handle.cancel();
    expect(cic).toHaveBeenCalledWith(id);
  });

  it('should fallback to timer manager when requestIdleCallback missing', () => {
    // ensure no requestIdleCallback
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;

    const setTimeoutSpy = vi.spyOn(globalTimerManager, 'setTimeout').mockImplementation((cb: any) => {
      cb();
      return 101;
    });
    const clearTimeoutSpy = vi.spyOn(globalTimerManager, 'clearTimeout').mockImplementation(() => undefined);

    const task = vi.fn();
    const handle = scheduleIdle(task);

    expect(setTimeoutSpy).toHaveBeenCalled();
    expect(task).toHaveBeenCalled();

    handle.cancel();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(101);
  });
});
// Duplicate imports removed - top-of-file imports already sufficient

describe('idle-scheduler', () => {
  beforeEach(() => {
    // Clear any existing global APIs
    delete (globalThis as any).requestIdleCallback;
    delete (globalThis as any).cancelIdleCallback;
    vi.spyOn(globalTimerManager, 'setTimeout');
    vi.spyOn(globalTimerManager, 'clearTimeout');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses requestIdleCallback when available', () => {
    const cbCalls: Array<() => void> = [];
    (globalThis as any).requestIdleCallback = (cb: () => void) => {
      cbCalls.push(cb);
      return 1;
    };
    (globalThis as any).cancelIdleCallback = vi.fn();

    const called = { run: false };
    const handle = scheduleIdle(() => {
      called.run = true;
    });

    // Trigger the callback
    cbCalls.forEach((cb) => cb());
    expect(called.run).toBe(true);

    // Now cancel - should call cancelIdleCallback
    handle.cancel();
    expect((globalThis as any).cancelIdleCallback).toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestIdleCallback missing', () => {
    // requestIdleCallback missing
    const called = { run: false };
    const handle = scheduleIdle(() => {
      called.run = true;
    });
    // Since setTimeout used, we need to simulate immediate execution via spy
    expect(globalTimerManager.setTimeout).toHaveBeenCalled();
    // Cancel should call clearTimeout
    handle.cancel();
    expect(globalTimerManager.clearTimeout).toHaveBeenCalled();
  });
});
// Duplicate imports removed - top-of-file imports and initial module imports are sufficient

describe("idle-scheduler", () => {
  let originalRIC: unknown;
  let originalCIC: unknown;

  beforeEach(() => {
    vi.useFakeTimers();
    originalRIC = (globalThis as unknown as Record<string, unknown>).requestIdleCallback;
    originalCIC = (globalThis as unknown as Record<string, unknown>).cancelIdleCallback;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalRIC !== undefined) {
      (globalThis as unknown as Record<string, unknown>).requestIdleCallback = originalRIC;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).requestIdleCallback;
    }
    if (originalCIC !== undefined) {
      (globalThis as unknown as Record<string, unknown>).cancelIdleCallback = originalCIC;
    } else {
      delete (globalThis as unknown as Record<string, unknown>).cancelIdleCallback;
    }
  });

  it("should execute task immediately via setTimeout fallback when requestIdleCallback is missing", () => {
    // Mock globalThis to remove requestIdleCallback
    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = undefined;

    const task = vi.fn();
    scheduleIdle(task);

    expect(task).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(task).toHaveBeenCalled();
  });

  it("should use requestIdleCallback if available", () => {
    const task = vi.fn();
    const ricMock = vi.fn((cb) => {
      cb({ didTimeout: false, timeRemaining: () => 50 });
      return 123;
    });
    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = ricMock;

    scheduleIdle(task);

    expect(ricMock).toHaveBeenCalled();
    expect(task).toHaveBeenCalled();
  });

  it("should cancel scheduled task (fallback)", () => {
    // Force fallback path
    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = undefined;

    const task = vi.fn();
    const handle = scheduleIdle(task);

    handle.cancel();
    vi.runAllTimers();
    expect(task).not.toHaveBeenCalled();
  });

  it("should cancel scheduled task using cancelIdleCallback when available", () => {
    const task = vi.fn();
    const ricMock = vi.fn(() => 123);
    const cicMock = vi.fn();

    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = ricMock;
    (globalThis as unknown as Record<string, unknown>).cancelIdleCallback = cicMock;

    const handle = scheduleIdle(task);
    handle.cancel();

    expect(cicMock).toHaveBeenCalledWith(123);
    // Task should not be called by the mock since we didn't execute the callback
    expect(task).not.toHaveBeenCalled();
  });

  it("should handle errors in task gracefully (fallback)", () => {
    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = undefined;

    const task = vi.fn(() => {
      throw new Error("Task failed");
    });

    scheduleIdle(task);

    // Should not throw
    expect(() => vi.runAllTimers()).not.toThrow();
    expect(task).toHaveBeenCalled();
  });

  it("should handle errors in task gracefully (requestIdleCallback)", () => {
    const task = vi.fn(() => {
      throw new Error("Task failed");
    });
    const ricMock = vi.fn((cb) => {
      cb({ didTimeout: false, timeRemaining: () => 50 });
      return 123;
    });

    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = ricMock;

    scheduleIdle(task);

    expect(ricMock).toHaveBeenCalled();
    expect(task).toHaveBeenCalled();
    // No error thrown
  });

  it("should handle missing cancelIdleCallback gracefully when requestIdleCallback exists", () => {
    const task = vi.fn();
    const ricMock = vi.fn(() => 123);

    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = ricMock;
    (globalThis as unknown as Record<string, unknown>).cancelIdleCallback = undefined;

    const handle = scheduleIdle(task);

    // Should not throw when calling cancel
    expect(() => handle.cancel()).not.toThrow();
  });
});
