// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { withRetry } from '@shared/async/retry';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('bounded guided retry', () => {
  it('waits for the server delay even when backoff is shorter', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const operation = vi.fn().mockRejectedValueOnce(new Error('rate limited')).mockResolvedValue('ok');
    const pending = withRetry(operation, {
      maxAttempts: 2,
      baseDelayMs: 0,
      retryAfterMs: () => 2_000,
      maxElapsedMs: 3_000,
      now: Date.now,
    });
    await vi.advanceTimersByTimeAsync(1_999);
    expect(operation).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ success: true, attempts: 2 });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('defers rather than retrying before guidance beyond the budget', async () => {
    const error = new Error('rate limited');
    const operation = vi.fn().mockRejectedValue(error);
    const result = await withRetry(operation, {
      maxAttempts: 3,
      baseDelayMs: 0,
      maxElapsedMs: 1_000,
      retryAfterMs: () => 5_000,
      now: () => 0,
    });
    expect(result).toEqual({ success: false, error, attempts: 1, deferredForMs: 5_000 });
    expect(operation).toHaveBeenCalledOnce();
  });

  it('does not extend the elapsed budget when wall time moves backward', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    let monotonicMs = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => monotonicMs);
    vi.setSystemTime(1_000_000);
    const error = new Error('retryable');
    const operation = vi.fn().mockRejectedValue(error);
    const pending = withRetry(operation, {
      maxAttempts: 3,
      baseDelayMs: 400,
      maxDelayMs: 400,
      maxElapsedMs: 500,
      random: () => 0,
    });
    await vi.advanceTimersByTimeAsync(0);
    vi.setSystemTime(-1_000_000);
    monotonicMs = 400;
    await vi.advanceTimersByTimeAsync(400);
    await expect(pending).resolves.toEqual({ success: false, error, attempts: 2 });
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('cancels an in-flight wait without another request', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const reason = new DOMException('Cancelled', 'AbortError');
    const operation = vi.fn().mockRejectedValue(new Error('rate limited'));
    const pending = withRetry(operation, {
      maxAttempts: 3,
      baseDelayMs: 0,
      retryAfterMs: () => 2_000,
      signal: controller.signal,
    });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort(reason);
    await expect(pending).resolves.toMatchObject({ success: false, attempts: 1 });
    expect(operation).toHaveBeenCalledOnce();
  });
});
