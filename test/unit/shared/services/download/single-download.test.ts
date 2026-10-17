// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import type { DownloadAdapter } from '@platform/types';
import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const { adapter, getDownloadAdapter } = vi.hoisted(() => ({
  adapter: {
    download: vi.fn<DownloadAdapter['download']>(async () => undefined),
    downloadBlob: vi.fn<DownloadAdapter['downloadBlob']>(async () => undefined),
    needsBlobFallback: vi.fn<DownloadAdapter['needsBlobFallback']>(() => false),
  },
  getDownloadAdapter: vi.fn(),
}));

vi.mock('@platform/index', () => ({ getDownloadAdapter }));

import { downloadSingleFile } from '@shared/services/download/single-download';

const video = {
  id: 'video-1',
  type: 'video' as const,
  url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/720x720/video.mp4',
};

describe('downloadSingleFile route ownership', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    getDownloadAdapter.mockReturnValue(adapter);
    adapter.download.mockResolvedValue(undefined);
    adapter.downloadBlob.mockImplementation(async (_blob, _filename, _signal, released) => {
      released?.();
    });
  });

  it('hands the canonical original image to one native download without fetching or reserving page bytes', async () => {
    const budget = new LiveByteBudget(1);
    const fetch = vi.spyOn(globalThis, 'fetch');
    const original = 'https://pbs.twimg.com/media/original?format=png&name=orig';
    const displayed = {
      id: '222_api_1',
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/original?format=jpg&name=small',
      tweetId: '222',
      tweetUsername: 'author',
      downloadSource: {
        url: original,
        quality: 'cdn-original' as const,
        provenance: 'dom' as const,
      },
    };
    const onProgress = vi.fn();

    await expect(
      downloadSingleFile(displayed, { liveBudget: budget, onProgress })
    ).resolves.toEqual({
      success: true,
      filename: 'author_222_1.png',
    });

    expect(adapter.download).toHaveBeenCalledExactlyOnceWith(
      original,
      'author_222_1.png',
      undefined,
      undefined
    );
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(budget.usedBytes).toBe(0);
    expect(onProgress.mock.calls.map(([progress]) => progress.phase)).toEqual([
      'preparing',
      'complete',
    ]);
  });

  it('sends a normal MP4 directly and does not replace a native failure with a Blob request', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    adapter.download.mockRejectedValueOnce(new Error('Browser download was interrupted'));

    await expect(downloadSingleFile(video, { liveBudget: new LiveByteBudget(1) })).resolves.toEqual(
      {
        success: false,
        error: 'Browser download was interrupted',
      }
    );

    expect(adapter.download).toHaveBeenCalledOnce();
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an unverified original before either privileged route', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    const displayed = {
      id: '222_dom_0',
      type: 'image' as const,
      url: 'https://pbs.twimg.com/media/photo?format=jpg&name=small&name=large',
      downloadSource: {
        url: '' as const,
        quality: 'unverified-original' as const,
        provenance: 'dom' as const,
      },
    };

    await expect(downloadSingleFile(displayed)).resolves.toMatchObject({
      success: false,
      code: 'SOURCE_UNAVAILABLE',
      error: expect.stringContaining('original image'),
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(getDownloadAdapter).not.toHaveBeenCalled();
    expect(adapter.download).not.toHaveBeenCalled();
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
  });

  it('rejects an invalid URL before either privileged route', async () => {
    await expect(
      downloadSingleFile({ ...video, url: 'http://video.twimg.com/video.mp4' })
    ).resolves.toEqual({
      success: false,
      error: 'Invalid media download URL',
    });
    expect(adapter.download).not.toHaveBeenCalled();
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
  });

  it('passes cancellation to the native owner without starting another route', async () => {
    const controller = new AbortController();
    adapter.download.mockImplementationOnce(
      (_url, _name, _headers, signal) =>
        new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
        })
    );
    const pending = downloadSingleFile(video, { signal: controller.signal });
    await vi.waitFor(() => expect(adapter.download).toHaveBeenCalledOnce());
    controller.abort();

    await expect(pending).resolves.toEqual({ success: false, error: USER_CANCELLED_MESSAGE });
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
  });

  it('keeps a supplied Blob charged through its actual URL owner release', async () => {
    const budget = new LiveByteBudget(8);
    let release: (() => void) | undefined;
    adapter.downloadBlob.mockImplementationOnce((_blob, _name, _signal, released) => {
      release = released;
      return new Promise<void>(() => undefined);
    });
    const controller = new AbortController();
    const pending = downloadSingleFile(video, {
      blob: new Blob(['12345678']),
      liveBudget: budget,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    controller.abort();
    await expect(pending).resolves.toEqual({ success: false, error: USER_CANCELLED_MESSAGE });
    expect(budget.usedBytes).toBe(8);
    release?.();
    expect(budget.usedBytes).toBe(0);
    expect(adapter.download).not.toHaveBeenCalled();
  });
});
