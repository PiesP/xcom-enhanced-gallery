import {
    TimerManager,
    globalTimerManager,
} from "@shared/utils/time/timer-management";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TimerManager", () => {
  let timerManager: TimerManager;

  beforeEach(() => {
    timerManager = new TimerManager();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should register and execute setTimeout", () => {
    const callback = vi.fn();
    timerManager.setTimeout(callback, 100);

    expect(timerManager.getActiveTimersCount()).toBe(1);

    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalled();
    expect(timerManager.getActiveTimersCount()).toBe(0);
  });

  it("should register and execute setInterval", () => {
    const callback = vi.fn();
    timerManager.setInterval(callback, 100);

    expect(timerManager.getActiveTimersCount()).toBe(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(2);

    expect(timerManager.getActiveTimersCount()).toBe(1);
  });

  it("should clear timeout", () => {
    const callback = vi.fn();
    const id = timerManager.setTimeout(callback, 100);

    timerManager.clearTimeout(id);
    expect(timerManager.getActiveTimersCount()).toBe(0);

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should clear interval", () => {
    const callback = vi.fn();
    const id = timerManager.setInterval(callback, 100);

    timerManager.clearInterval(id);
    expect(timerManager.getActiveTimersCount()).toBe(0);

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should cleanup all timers", () => {
    const callback = vi.fn();
    timerManager.setTimeout(callback, 100);
    timerManager.setInterval(callback, 100);

    expect(timerManager.getActiveTimersCount()).toBe(2);

    timerManager.cleanup();
    expect(timerManager.getActiveTimersCount()).toBe(0);

    vi.advanceTimersByTime(100);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should export global instance", () => {
    expect(globalTimerManager).toBeInstanceOf(TimerManager);
  });
});
