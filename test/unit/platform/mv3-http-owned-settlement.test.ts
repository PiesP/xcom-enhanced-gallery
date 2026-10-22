// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { MV3HttpRequestAdapter } from '@platform/mv3-http-request-adapters';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('MV3 HTTP transport settlement', () => {
  it.each([
    ['caller abort', 'close'],
    ['caller abort', 'error'],
    ['timeout', 'close'],
    ['timeout', 'error'],
  ] as const)(
    'preserves a 429 after the first body chunk on %s and late %s',
    async (cause, terminal) => {
      vi.useFakeTimers();
      let bodyController: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>> | undefined;
      let finishPull: (() => void) | undefined;
      let observeSecondRead: (() => void) | undefined;
      const secondRead = new Promise<void>((resolve) => {
        observeSecondRead = resolve;
      });
      const body = new ReadableStream<Uint8Array<ArrayBuffer>>(
        {
          start(controller) {
            bodyController = controller;
            controller.enqueue(new Uint8Array([1]));
          },
          pull() {
            observeSecondRead?.();
            return new Promise<void>((resolve) => {
              finishPull = resolve;
            });
          },
        },
        { highWaterMark: 0 }
      );
      const fetch = vi.fn((_url: string, init: RequestInit) => {
        expect(init.redirect).toBe('error');
        return Promise.resolve(
          new Response(body, { status: 429, headers: { 'retry-after': '6' } })
        );
      });
      vi.stubGlobal('fetch', fetch);
      const onload = vi.fn();
      const onerror = vi.fn();
      const onabort = vi.fn();
      const ontimeout = vi.fn();
      const onsettled = vi.fn();
      const control = new MV3HttpRequestAdapter().request({
        url: 'https://x.com/i/api/graphql/fixture/TweetResultByRestId',
        responseType: 'arraybuffer',
        maxResponseBytes: 16,
        timeout: 25,
        onload,
        onerror,
        onabort,
        ontimeout,
        onsettled,
      });

      await secondRead;
      expect(fetch).toHaveBeenCalledOnce();
      expect(bodyController).toBeDefined();
      expect(onsettled).not.toHaveBeenCalled();
      if (cause === 'caller abort') {
        control.abort();
      } else {
        await vi.advanceTimersByTimeAsync(25);
      }
      expect(fetch.mock.calls[0]?.[1].signal?.aborted).toBe(true);
      expect(onsettled).not.toHaveBeenCalled();

      finishPull?.();
      if (terminal === 'close') {
        bodyController?.close();
      } else {
        bodyController?.error(new Error('late body read failure'));
      }
      await vi.advanceTimersByTimeAsync(0);

      const expected = cause === 'caller abort' ? onabort : ontimeout;
      expect(expected).toHaveBeenCalledOnce();
      expect(expected).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 429,
          retryAfterMs: 6_000,
          readable: false,
          errorCategory: cause === 'caller abort' ? 'abort' : 'timeout',
        })
      );
      expect(onload).not.toHaveBeenCalled();
      expect(onerror).not.toHaveBeenCalled();
      expect(cause === 'caller abort' ? ontimeout : onabort).not.toHaveBeenCalled();
      expect(onsettled).toHaveBeenCalledOnce();
      expect(body.locked).toBe(false);
      await vi.advanceTimersByTimeAsync(50);
      expect(onsettled).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
      expect(fetch).toHaveBeenCalledOnce();
    }
  );

  it('keeps an aborted fetch unsettled until the transport promise rejects', async () => {
    let rejectFetch: ((reason: unknown) => void) | undefined;
    const fetch = vi.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          rejectFetch = reject;
        })
    );
    vi.stubGlobal('fetch', fetch);
    const onabort = vi.fn();
    const onsettled = vi.fn();
    const request = new MV3HttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/test',
      responseType: 'arraybuffer',
      maxResponseBytes: 4,
      onabort,
      onsettled,
    });
    expect(fetch).toHaveBeenCalledOnce();
    request.abort();
    expect(onsettled).not.toHaveBeenCalled();
    rejectFetch?.(new DOMException('aborted', 'AbortError'));
    await vi.waitFor(() => expect(onsettled).toHaveBeenCalledOnce());
    expect(onabort).toHaveBeenCalledOnce();
  });

  it('settles a rejected URL without starting a fetch', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const onerror = vi.fn();
    const onsettled = vi.fn();
    new MV3HttpRequestAdapter().request({
      url: 'https://invalid.example/test',
      onerror,
      onsettled,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalledOnce();
    expect(onsettled).toHaveBeenCalledOnce();
  });

  it('reports settlement even when a load callback throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 }))
    );
    const onsettled = vi.fn();
    new MV3HttpRequestAdapter().request({
      url: 'https://pbs.twimg.com/media/test',
      responseType: 'arraybuffer',
      maxResponseBytes: 2,
      onload: () => {
        throw new Error('consumer callback failed');
      },
      onsettled,
    });
    await vi.waitFor(() => expect(onsettled).toHaveBeenCalledOnce());
  });
});
