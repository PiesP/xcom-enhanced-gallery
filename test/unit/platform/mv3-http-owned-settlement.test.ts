// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { MV3HttpRequestAdapter } from '@platform/mv3-http-request-adapters';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

describe('MV3 HTTP transport settlement', () => {
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
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1]), { status: 200 })));
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
