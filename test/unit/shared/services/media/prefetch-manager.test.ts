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

import { PrefetchManager } from '@shared/services/media/prefetch-manager';

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

function media(id: string): MediaInfo {
  return {
    id,
    type: 'image',
    url: `https://pbs.twimg.com/media/${id}.jpg`,
  };
}

describe('PrefetchManager lifecycle races', () => {
  beforeEach(() => {
    http.get.mockReset();
  });

  it('does not let an evicted late response evict the current cache entry', async () => {
    const first = deferredResponse();
    const current = deferredResponse();
    const signals: AbortSignal[] = [];
    http.get.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return signals.length === 1 ? first.promise : current.promise;
    });
    const manager = new PrefetchManager(1, 5);
    const firstMedia = media('first');
    const currentMedia = media('current');

    const firstPrefetch = manager.prefetch(firstMedia, 'immediate');
    const currentPrefetch = manager.prefetch(currentMedia, 'immediate');

    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);

    // Simulate an adapter that cannot stop an already-completing response.
    first.resolve({ ok: true, status: 200, data: new Blob(['stale-data']) });
    await firstPrefetch;

    expect(signals[1]?.aborted).toBe(false);

    current.resolve({ ok: true, status: 200, data: new Blob(['live']) });
    await currentPrefetch;

    expect(manager.get(currentMedia.url)).not.toBeNull();
    manager.destroy();
  });

  it('keeps a replacement request abortable after an older request settles', async () => {
    const first = deferredResponse();
    const displaced = deferredResponse();
    const replacement = deferredResponse();
    const responses = [first, displaced, replacement];
    const signals: AbortSignal[] = [];
    http.get.mockImplementation((_url: string, options: { signal: AbortSignal }) => {
      signals.push(options.signal);
      return responses[signals.length - 1]!.promise;
    });
    const manager = new PrefetchManager(1, 100);
    const firstMedia = media('same');

    const firstPrefetch = manager.prefetch(firstMedia, 'immediate');
    const displacedPrefetch = manager.prefetch(media('displaced'), 'immediate');
    const replacementPrefetch = manager.prefetch(firstMedia, 'immediate');

    first.resolve({ ok: true, status: 200, data: new Blob(['old']) });
    await firstPrefetch;
    manager.destroy();

    expect(signals[2]?.aborted).toBe(true);

    displaced.resolve({ ok: true, status: 200, data: new Blob(['displaced']) });
    replacement.resolve({ ok: true, status: 200, data: new Blob(['replacement']) });
    await Promise.all([displacedPrefetch, replacementPrefetch]);
  });

  it('does not start new work after destruction', async () => {
    const manager = new PrefetchManager();
    manager.destroy();

    await manager.prefetch(media('after-destroy'), 'immediate');

    expect(http.get).not.toHaveBeenCalled();
  });
});
