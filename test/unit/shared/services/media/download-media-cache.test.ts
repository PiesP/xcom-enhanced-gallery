// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { MediaInfo } from '@shared/types/media.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({
  getOwnedBinary: vi.fn(),
}));

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => http,
}));

import { DownloadMediaCache } from '@shared/services/media/download-media-cache';
import {
  DownloadResourceLimitError,
  LiveByteBudget,
  type OwnedBlob,
} from '@shared/services/download/live-byte-budget';

interface DeferredResponse {
  readonly promise: Promise<{ ok: boolean; status: number; data: Blob; lease: OwnedBlob['lease'] }>;
  readonly resolve: (response: {
    ok: boolean;
    status: number;
    data: Blob;
    lease: OwnedBlob['lease'];
  }) => void;
}

function deferredResponse(): DeferredResponse {
  let resolve!: DeferredResponse['resolve'];
  const promise = new Promise<Awaited<DeferredResponse['promise']>>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

let budget: LiveByteBudget;

function ownedResponse(data: string): Awaited<DeferredResponse['promise']> {
  const blob = new Blob([data]);
  return { ok: true, status: 200, data: blob, lease: budget.reserve(blob.size) };
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
    http.getOwnedBinary.mockReset();
    budget = new LiveByteBudget(128);
  });

  it('starts requests only when an image download asks for media', () => {
    const cache = new DownloadMediaCache(5, 100, budget);

    expect(http.getOwnedBinary).not.toHaveBeenCalled();
    expect(cache.getOrFetch(media('video', 'video'))).toBeNull();
    expect(cache.getOrFetch(media('gif', 'gif'))).toBeNull();
    expect(http.getOwnedBinary).not.toHaveBeenCalled();

    cache.destroy();
  });

  it('reuses the same demand-driven request', async () => {
    const response = deferredResponse();
    http.getOwnedBinary.mockReturnValue(response.promise);
    const cache = new DownloadMediaCache(5, 100, budget);
    const item = media('same');

    const first = cache.getOrFetch(item)!;
    const second = cache.getOrFetch(item)!;

    expect(first).not.toBe(second);
    expect(http.getOwnedBinary).toHaveBeenCalledTimes(1);

    response.resolve(ownedResponse('image'));
    const firstOwner = await first;
    const secondOwner = await second;
    expect(firstOwner.value).toBe(secondOwner.value);
    expect(firstOwner.lease).not.toBe(secondOwner.lease);
    expect(budget.usedBytes).toBe(5);
    firstOwner.lease.release();
    cache.destroy();
    expect(budget.usedBytes).toBe(5);
    secondOwner.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('reuses one completed cache entry while giving a later caller its own lease', async () => {
    http.getOwnedBinary.mockImplementation(async () => ownedResponse('shared-image'));
    const cache = new DownloadMediaCache(5, 100, budget);
    const item = media('shared');

    const first = await cache.getOrFetch(item)!;
    const second = await cache.getOrFetch(item)!;
    expect(first.value).toBe(second.value);
    expect(first.lease).not.toBe(second.lease);
    expect(http.getOwnedBinary).toHaveBeenCalledTimes(1);
    first.lease.release();
    second.lease.release();
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('keeps an evicted entry charged while a borrower still owns it', async () => {
    budget = new LiveByteBudget(5);
    http.getOwnedBinary.mockImplementation(async () => ownedResponse('four'));
    const cache = new DownloadMediaCache(1, 5, budget);
    const first = await cache.getOrFetch(media('first'));

    await expect(cache.getOrFetch(media('second'))).rejects.toBeInstanceOf(
      DownloadResourceLimitError
    );
    expect(budget.usedBytes).toBe(4);

    first?.lease.release();
    expect(budget.usedBytes).toBe(0);
    const retry = await cache.getOrFetch(media('second'));
    retry?.lease.release();
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('does not retain an image that exceeds the byte budget', async () => {
    http.getOwnedBinary.mockImplementation(async () => ownedResponse('oversized'));
    const cache = new DownloadMediaCache(2, 4, budget);
    const item = media('oversized');

    const first = await cache.getOrFetch(item);
    first?.lease.release();
    const second = await cache.getOrFetch(item);
    second?.lease.release();

    expect(http.getOwnedBinary).toHaveBeenCalledTimes(2);
    expect(http.getOwnedBinary).toHaveBeenCalledWith(
      item.url,
      expect.objectContaining({ maxResponseBytes: 4 })
    );
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('uses a smaller caller response budget before materializing a cache entry', async () => {
    http.getOwnedBinary.mockImplementation(async () => ownedResponse('ok'));
    const cache = new DownloadMediaCache(2, 10, budget);
    const item = media('caller-budget');

    const borrowed = await cache.getOrFetch(item, undefined, 3);
    borrowed?.lease.release();

    expect(http.getOwnedBinary).toHaveBeenCalledWith(
      item.url,
      expect.objectContaining({ maxResponseBytes: 3 })
    );
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('rejects a cached Blob for a later caller with a smaller response cap', async () => {
    http.getOwnedBinary.mockImplementation(async () => ownedResponse('four'));
    const cache = new DownloadMediaCache(2, 10, budget);
    const item = media('later-cap');
    const first = await cache.getOrFetch(item);

    await expect(cache.getOrFetch(item, undefined, 3)).rejects.toMatchObject({
      name: 'HttpResponseSizeLimitError',
    });
    expect(http.getOwnedBinary).toHaveBeenCalledTimes(1);
    first?.lease.release();
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('removes a failed request so the download path can retry', async () => {
    http.getOwnedBinary
      .mockRejectedValueOnce(new Error('cache request failed'))
      .mockImplementationOnce(async () => ownedResponse('retry'));
    const cache = new DownloadMediaCache(5, 100, budget);
    const item = media('retry');

    await expect(cache.getOrFetch(item)).rejects.toThrow('cache request failed');
    const borrowed = await cache.getOrFetch(item);
    expect(borrowed?.value).toBeInstanceOf(Blob);
    borrowed?.lease.release();

    expect(http.getOwnedBinary).toHaveBeenCalledTimes(2);
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });

  it('propagates caller cancellation and does not revive the cache after teardown', async () => {
    const response = deferredResponse();
    let requestSignal: AbortSignal | undefined;
    http.getOwnedBinary.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      requestSignal = options.signal;
      return response.promise;
    });
    const cache = new DownloadMediaCache(5, 100, budget);
    const controller = new AbortController();
    const item = media('cancelled');

    const pending = cache.getOrFetch(item, controller.signal);
    controller.abort();

    expect(requestSignal?.aborted).toBe(true);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });

    // A transport may still materialize after the caller-facing abort settles.
    response.resolve(ownedResponse('late'));
    await vi.waitFor(() => expect(budget.usedBytes).toBe(0));
    cache.destroy();

    expect(cache.getOrFetch(item)).toBeNull();
  });

  it('does not let an evicted late response evict the current cache entry', async () => {
    const first = deferredResponse();
    const current = deferredResponse();
    const signals: AbortSignal[] = [];
    http.getOwnedBinary.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return signals.length === 1 ? first.promise : current.promise;
    });
    const cache = new DownloadMediaCache(1, 5, budget);
    const firstMedia = media('first');
    const currentMedia = media('current');

    const firstRequest = cache.getOrFetch(firstMedia);
    const currentRequest = cache.getOrFetch(currentMedia);

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    await expect(firstRequest).rejects.toMatchObject({ name: 'AbortError' });

    first.resolve(ownedResponse('stale-data'));
    await vi.waitFor(() => expect(budget.usedBytes).toBe(0));
    expect(signals[1]?.aborted).toBe(false);

    current.resolve(ownedResponse('live'));
    const currentOwner = await currentRequest;
    const secondOwner = await cache.getOrFetch(currentMedia);
    expect(currentOwner?.value).toBe(secondOwner?.value);
    expect(http.getOwnedBinary).toHaveBeenCalledTimes(2);
    currentOwner?.lease.release();
    secondOwner?.lease.release();
    cache.destroy();
    expect(budget.usedBytes).toBe(0);
  });
});
