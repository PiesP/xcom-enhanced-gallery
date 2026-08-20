// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => http,
}));

import { DownloadMediaCache } from '@shared/services/media/download-media-cache';
import { downloadAsZip } from '@shared/services/download/zip-download';

interface DeferredResponse {
  readonly promise: Promise<{ ok: boolean; status: number; data: Blob }>;
  readonly resolve: (response: { ok: boolean; status: number; data: Blob }) => void;
}

function deferredResponse(): DeferredResponse {
  let resolve!: DeferredResponse['resolve'];
  const promise = new Promise<{ ok: boolean; status: number; data: Blob }>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

function media(id: string, type: MediaInfo['type'] = 'image'): MediaInfo {
  return {
    id,
    type,
    url: `https://pbs.twimg.com/media/${id}.jpg`,
  };
}

describe('DownloadMediaCache', () => {
  beforeEach(() => {
    http.get.mockReset();
  });

  it('starts requests only when an image download asks for media', () => {
    const cache = new DownloadMediaCache();

    expect(http.get).not.toHaveBeenCalled();
    expect(cache.getOrFetch(media('video', 'video'))).toBeNull();
    expect(cache.getOrFetch(media('gif', 'gif'))).toBeNull();
    expect(http.get).not.toHaveBeenCalled();

    cache.destroy();
  });

  it('reuses the same demand-driven request', async () => {
    const response = deferredResponse();
    http.get.mockReturnValue(response.promise);
    const cache = new DownloadMediaCache();
    const item = media('same');

    const first = cache.getOrFetch(item);
    const second = cache.getOrFetch(item);

    expect(first).toBe(second);
    expect(http.get).toHaveBeenCalledTimes(1);

    response.resolve({ ok: true, status: 200, data: new Blob(['image']) });
    await expect(first).resolves.toBeInstanceOf(Blob);
    cache.destroy();
  });

  it('reuses one cached request for duplicate URLs in a lazy bulk download', async () => {
    http.get.mockResolvedValue({ ok: true, status: 200, data: new Blob(['shared-image']) });
    const cache = new DownloadMediaCache();
    const item = media('shared');

    const result = await downloadAsZip(
      [
        {
          url: item.url,
          desiredName: 'shared.jpg',
          getBlob: (signal) => cache.getOrFetch(item, signal),
        },
        {
          url: item.url,
          desiredName: 'shared-copy.jpg',
          getBlob: (signal) => cache.getOrFetch(item, signal),
        },
      ],
      { concurrency: 2 }
    );

    expect(result.filesSuccessful).toBe(2);
    expect(http.get).toHaveBeenCalledTimes(1);
    cache.destroy();
  });

  it('does not retain an image that exceeds the byte budget', async () => {
    http.get.mockResolvedValue({ ok: true, status: 200, data: new Blob(['oversized']) });
    const cache = new DownloadMediaCache(2, 4);
    const item = media('oversized');

    await cache.getOrFetch(item);
    await cache.getOrFetch(item);

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get).toHaveBeenCalledWith(
      item.url,
      expect.objectContaining({ maxResponseBytes: 4 })
    );
    cache.destroy();
  });

  it('uses a smaller caller response budget before materializing a cache entry', async () => {
    http.get.mockResolvedValue({ ok: true, status: 200, data: new Blob(['ok']) });
    const cache = new DownloadMediaCache(2, 10);
    const item = media('caller-budget');

    await cache.getOrFetch(item, undefined, 3);

    expect(http.get).toHaveBeenCalledWith(
      item.url,
      expect.objectContaining({ maxResponseBytes: 3 })
    );
    cache.destroy();
  });

  it('removes a failed request so the download path can retry', async () => {
    http.get
      .mockRejectedValueOnce(new Error('cache request failed'))
      .mockResolvedValueOnce({ ok: true, status: 200, data: new Blob(['retry']) });
    const cache = new DownloadMediaCache();
    const item = media('retry');

    await expect(cache.getOrFetch(item)).rejects.toThrow('cache request failed');
    await expect(cache.getOrFetch(item)).resolves.toBeInstanceOf(Blob);

    expect(http.get).toHaveBeenCalledTimes(2);
    cache.destroy();
  });

  it('propagates caller cancellation and does not revive the cache after teardown', async () => {
    const response = deferredResponse();
    let requestSignal: AbortSignal | undefined;
    http.get.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      requestSignal = options.signal;
      return response.promise;
    });
    const cache = new DownloadMediaCache();
    const controller = new AbortController();
    const item = media('cancelled');

    const pending = cache.getOrFetch(item, controller.signal);
    controller.abort();

    expect(requestSignal?.aborted).toBe(true);

    // Simulate an adapter that resolves after abort; it must not repopulate state.
    response.resolve({ ok: true, status: 200, data: new Blob(['late']) });
    await pending;
    cache.destroy();

    expect(cache.getOrFetch(item)).toBeNull();
  });

  it('does not let an evicted late response evict the current cache entry', async () => {
    const first = deferredResponse();
    const current = deferredResponse();
    const signals: AbortSignal[] = [];
    http.get.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return signals.length === 1 ? first.promise : current.promise;
    });
    const cache = new DownloadMediaCache(1, 5);
    const firstMedia = media('first');
    const currentMedia = media('current');

    const firstRequest = cache.getOrFetch(firstMedia);
    const currentRequest = cache.getOrFetch(currentMedia);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    first.resolve({ ok: true, status: 200, data: new Blob(['stale-data']) });
    await firstRequest;
    expect(signals[1]?.aborted).toBe(false);

    current.resolve({ ok: true, status: 200, data: new Blob(['live']) });
    await currentRequest;
    expect(cache.getOrFetch(currentMedia)).toBe(currentRequest);
    cache.destroy();
  });
});
