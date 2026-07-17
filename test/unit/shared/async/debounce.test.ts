// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebounced } from "@shared/async/debounce";

describe("createDebounced", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not call the function immediately", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced("arg");

    expect(fn).not.toHaveBeenCalled();
  });

  it("calls the function after the delay", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced("arg");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("arg");
  });

  it("only calls the function once for rapid successive invocations", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced(1);
    debounced(2);
    debounced(3);

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    // Last argument wins
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("resets the timer on each call", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced(1);
    vi.advanceTimersByTime(50);
    debounced(2); // Resets timer
    vi.advanceTimersByTime(50);
    // Only 50ms since last call, fn should not be called yet
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it("cancel prevents pending execution", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced("arg");
    debounced.cancel();

    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();
  });

  it("cancel does nothing when no pending call", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    // Should not throw
    expect(() => debounced.cancel()).not.toThrow();
  });

  it("flush calls the function immediately with last args", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced("a");
    debounced("b");
    debounced.flush();

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("flush does nothing when no pending call", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    // Should not throw
    expect(() => debounced.flush()).not.toThrow();
    expect(fn).not.toHaveBeenCalled();
  });

  it("works with the default delay of 300ms", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn); // No delay argument

    debounced();
    vi.advanceTimersByTime(299);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not call after cancel then new invocation (is idempotent)", () => {
    const fn = vi.fn();
    const debounced = createDebounced(fn, 100);

    debounced("first");
    debounced.cancel();

    // New call after cancel should work
    debounced("second");
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("second");
  });

  it("handles multiple invocations with different argument types", () => {
    const fn = vi.fn();
    const debounced = createDebounced<[string, number]>(fn, 100);

    debounced("key", 1);
    debounced("key", 2);

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith("key", 2);
  });
});
