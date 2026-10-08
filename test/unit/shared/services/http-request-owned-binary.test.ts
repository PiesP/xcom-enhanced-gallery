// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { HttpRequestControl, HttpRequestDetails, HttpRequestResponse } from '@platform/types';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { HttpRequestService } from '@shared/services/http-request-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestState = vi.hoisted(() => ({
  calls: 0,
  impl: null as null | ((details: HttpRequestDetails) => HttpRequestControl),
}));
vi.mock('@platform/index', () => ({
  getHttpRequestAdapter: () => ({
    request: (details: HttpRequestDetails): HttpRequestControl => {
      requestState.calls++;
      if (!requestState.impl) throw new Error('Missing HTTP fixture');
      return requestState.impl(details);
    },
  }),
}));

const response = (body: ArrayBuffer, status = 200): HttpRequestResponse => ({
  finalUrl: 'https://pbs.twimg.com/media/test',
  readyState: 4,
  status,
  statusText: status === 200 ? 'OK' : 'ERROR',
  responseHeaders: '',
  response: body,
  responseText: '',
});

describe('owned binary HTTP response', () => {
  beforeEach(() => {
    requestState.calls = 0;
    requestState.impl = null;
  });

  it('reserves transport copies before request and retains only returned bytes after settlement', async () => {
    const usage: number[] = [];
    const budget = new LiveByteBudget(16, (used) => usage.push(used));
    let details: HttpRequestDetails | undefined;
    let usedAtRequest = -1;
    requestState.impl = (value) => {
      details = value;
      usedAtRequest = budget.usedBytes;
      return { abort: vi.fn() };
    };
    const pending = new HttpRequestService().getOwnedBinary<ArrayBuffer>(response(new ArrayBuffer(0)).finalUrl, {
      responseType: 'arraybuffer',
      maxResponseBytes: 6,
      budget,
    });
    expect(usedAtRequest).toBe(12);
    expect(usage).toEqual([12]);
    expect(details?.maxResponseBytes).toBe(6);
    details?.onload?.(response(new ArrayBuffer(3)));
    const owned = await pending;
    expect(owned.data.byteLength).toBe(3);
    expect(budget.usedBytes).toBe(12);
    details?.onsettled?.();
    expect(budget.usedBytes).toBe(3);
    owned.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('rejects abort promptly but holds the reservation until a delayed terminal callback', async () => {
    const budget = new LiveByteBudget(12);
    const controller = new AbortController();
    const abort = vi.fn();
    let details: HttpRequestDetails | undefined;
    requestState.impl = (value) => {
      details = value;
      return { abort };
    };
    const pending = new HttpRequestService().getOwnedBinary<ArrayBuffer>('https://pbs.twimg.com/media/test', {
      responseType: 'arraybuffer',
      maxResponseBytes: 6,
      budget,
      signal: controller.signal,
    });
    controller.abort(new DOMException('cancelled', 'AbortError'));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(abort).toHaveBeenCalledOnce();
    expect(budget.usedBytes).toBe(12);
    details?.onload?.(response(new ArrayBuffer(6)));
    expect(budget.usedBytes).toBe(12);
    details?.onsettled?.();
    details?.onsettled?.();
    expect(budget.usedBytes).toBe(0);
  });

  it('holds capacity after an early size error until the transport reports settlement', async () => {
    const budget = new LiveByteBudget(12);
    let details: HttpRequestDetails | undefined;
    requestState.impl = (value) => {
      details = value;
      return { abort: vi.fn() };
    };
    const pending = new HttpRequestService().getOwnedBinary<ArrayBuffer>('https://pbs.twimg.com/media/test', {
      responseType: 'arraybuffer',
      maxResponseBytes: 6,
      budget,
    });
    details?.onerror?.({
      ...response(new ArrayBuffer(0), 0),
      response: new HttpResponseSizeLimitError(6, 7),
    });
    await expect(pending).rejects.toBeInstanceOf(HttpResponseSizeLimitError);
    expect(budget.usedBytes).toBe(12);
    details?.onsettled?.();
    expect(budget.usedBytes).toBe(0);
  });

  it.each([false, true])('retains transport capacity if cancel throws (abort during start: %s)', async (duringStart) => {
    const budget = new LiveByteBudget(12);
    const controller = new AbortController();
    let details: HttpRequestDetails | undefined;
    requestState.impl = (value) => {
      details = value;
      if (duringStart) controller.abort();
      return { abort: () => { throw new Error('manager cancel failed'); } };
    };
    const pending = new HttpRequestService().getOwnedBinary<ArrayBuffer>('https://pbs.twimg.com/media/test', {
      responseType: 'arraybuffer', maxResponseBytes: 6, budget, signal: controller.signal,
    });
    if (!duringStart) controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(budget.usedBytes).toBe(12);
    expect(() => budget.reserve(1)).toThrow();
    details?.onload?.(response(new ArrayBuffer(6)));
    expect(budget.usedBytes).toBe(12);
    details?.onsettled?.();
    expect(budget.usedBytes).toBe(0);
    const next = budget.reserve(12);
    next.release();
  });

  it('releases a synchronous adapter failure and does not send it to the network again', async () => {
    const budget = new LiveByteBudget(12);
    const seen: number[] = [];
    requestState.impl = () => {
      seen.push(budget.usedBytes);
      throw new Error('invalid URL');
    };
    let observed: unknown;
    try {
      await new HttpRequestService().getOwnedBinary<ArrayBuffer>('https://invalid.example/', {
        responseType: 'arraybuffer',
        maxResponseBytes: 6,
        budget,
      });
    } catch (error) {
      observed = error;
    }
    expect(observed).toMatchObject({ message: 'invalid URL' });
    expect(seen).toEqual([12]);
    expect(budget.usedBytes).toBe(0);
    expect(requestState.calls).toBe(1);
  });

  it('reserves only the remaining capacity and bounds the adapter to that capacity', async () => {
    const budget = new LiveByteBudget(12);
    const other = budget.reserve(8);
    let details: HttpRequestDetails | undefined;
    requestState.impl = (value) => {
      details = value;
      return { abort: vi.fn() };
    };
    const pending = new HttpRequestService().getOwnedBinary<Blob>('https://pbs.twimg.com/media/test', {
      responseType: 'blob',
      maxResponseBytes: 6,
      budget,
    });
    expect(details?.maxResponseBytes).toBe(2);
    details?.onload?.({ ...response(new ArrayBuffer(0)), response: new Blob(['abc']) });
    details?.onsettled?.();
    await expect(pending).rejects.toMatchObject({ name: 'HttpResponseSizeLimitError' });
    expect(budget.usedBytes).toBe(8);
    other.release();
    expect(budget.usedBytes).toBe(0);
  });
});
