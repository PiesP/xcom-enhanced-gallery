// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { afterEach, describe, expect, it, vi } from 'vitest';
import { MV3HttpRequestAdapter } from '@platform/mv3-http-request-adapters';
import type { HttpRequestResponse } from '@platform/types';

const ALLOWED_URL = 'https://pbs.twimg.com/media/example.jpg';

function successfulResponse(body = 'ok'): Response {
  return new Response(body, {
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'text/plain' },
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('MV3HttpRequestAdapter', () => {
  it('rejects an unknown-length streamed response before it exceeds the byte limit', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { 'content-type': 'application/octet-stream' },
        })
      )
    );
    const onload = vi.fn();

    const error = await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        responseType: 'arraybuffer',
        maxResponseBytes: 3,
        onload,
        onerror: resolve,
      });
    });

    expect(error.statusText).toBe('RESOURCE_LIMIT');
    expect(onload).not.toHaveBeenCalled();
  });

  it('accepts an unknown-length streamed response within the byte limit', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3, 4]));
        controller.close();
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(stream, {
          status: 200,
          headers: { 'content-type': 'application/octet-stream' },
        })
      )
    );

    const response = await new Promise<HttpRequestResponse<ArrayBuffer>>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        responseType: 'arraybuffer',
        maxResponseBytes: 4,
        onload: (value) => resolve(value as HttpRequestResponse<ArrayBuffer>),
      });
    });

    expect(new Uint8Array(response.response)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('rejects an oversized Content-Length before consuming the response body', async () => {
    const body = new ReadableStream<Uint8Array>({
      pull: vi.fn(),
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: { 'content-length': '5' },
        })
      )
    );
    const onload = vi.fn();

    const error = await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        responseType: 'blob',
        maxResponseBytes: 4,
        onload,
        onerror: resolve,
      });
    });

    expect(error.statusText).toBe('RESOURCE_LIMIT');
    expect(onload).not.toHaveBeenCalled();
    expect(body.locked).toBe(false);
  });

  it('rejects a body that exceeds the limit when Content-Length understates it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { 'content-length': '2' },
        })
      )
    );

    const error = await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        responseType: 'arraybuffer',
        maxResponseBytes: 3,
        onerror: resolve,
      });
    });

    expect(error.statusText).toBe('RESOURCE_LIMIT');
  });

  it('rejects disallowed URLs before fetch', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const onerror = vi.fn();

    const control = new MV3HttpRequestAdapter().request({
      url: 'https://example.com/private',
      onerror,
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onerror).toHaveBeenCalledWith(
      expect.objectContaining({ status: 0, statusText: 'NETWORK_ERROR' })
    );
    expect(() => control.abort()).not.toThrow();
  });

  it('does not attach a body when the omitted method defaults to GET', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal('fetch', fetchSpy);

    const response = await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        data: 'must-not-be-sent',
        onload: resolve,
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(ALLOWED_URL, expect.objectContaining({ method: 'GET' }));
    const fetchInit = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    expect(fetchInit.body).toBeUndefined();
    expect(response).toMatchObject({ status: 200, response: 'ok', responseText: 'ok' });
  });

  it('preserves FormData bodies instead of JSON-stringifying them', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(successfulResponse());
    vi.stubGlobal('fetch', fetchSpy);
    const form = new FormData();
    form.append('media', new Blob(['data']), 'media.jpg');

    await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        method: 'POST',
        url: ALLOWED_URL,
        data: form,
        onload: resolve,
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      ALLOWED_URL,
      expect.objectContaining({ method: 'POST', body: form })
    );
  });

  it('returns a stream without buffering it as text', async () => {
    const stream = new ReadableStream<Uint8Array>();
    const text = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        body: stream,
        headers: new Headers(),
        status: 200,
        statusText: 'OK',
        url: ALLOWED_URL,
        text,
      } satisfies Partial<Response>)
    );

    const response = await new Promise<HttpRequestResponse>((resolve) => {
      new MV3HttpRequestAdapter().request({
        url: ALLOWED_URL,
        responseType: 'stream',
        onload: resolve,
      });
    });

    expect(response.response).toBe(stream);
    expect(response.responseText).toBe('');
    expect(text).not.toHaveBeenCalled();
  });

  it('distinguishes a caller abort from a timeout', async () => {
    const fetchSpy = vi.fn((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true }
        );
      })
    );
    vi.stubGlobal('fetch', fetchSpy);
    const onabort = vi.fn();
    const ontimeout = vi.fn();

    const control = new MV3HttpRequestAdapter().request({
      url: ALLOWED_URL,
      onabort,
      ontimeout,
    });
    control.abort();
    await vi.waitFor(() => expect(onabort).toHaveBeenCalledOnce());

    expect(ontimeout).not.toHaveBeenCalled();
  });

  it('reports an elapsed deadline through ontimeout only', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        })
      )
    );
    const onabort = vi.fn();
    const ontimeout = vi.fn();

    new MV3HttpRequestAdapter().request({
      url: ALLOWED_URL,
      timeout: 25,
      onabort,
      ontimeout,
    });
    await vi.advanceTimersByTimeAsync(25);

    expect(ontimeout).toHaveBeenCalledOnce();
    expect(onabort).not.toHaveBeenCalled();
  });
});
