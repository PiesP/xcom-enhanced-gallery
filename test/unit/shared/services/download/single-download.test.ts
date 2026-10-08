// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { LiveByteBudget } from '@shared/services/download/live-byte-budget';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES,
} from '@constants/performance';
import type { DownloadAdapter } from '@platform/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adapter, getDownloadAdapter } = vi.hoisted(() => {
  const download = vi.fn<DownloadAdapter['download']>(async () => undefined);
  return {
    adapter: {
      download,
      downloadBlob: vi.fn<DownloadAdapter['downloadBlob']>(async () => undefined),
      needsBlobFallback: vi.fn<DownloadAdapter['needsBlobFallback']>(() => true),
    },
    getDownloadAdapter: vi.fn(),
  };
});

vi.mock('@platform/index', () => ({ getDownloadAdapter }));

import { downloadSingleFile } from '@shared/services/download/single-download';

const media = {
  id: 'video-1',
  type: 'video' as const,
  url: 'https://video.twimg.com/ext_tw_video/123/pu/vid/720x720/video.mp4',
};

function successfulResponse(blob = new Blob(['video'])): Response {
  return new Response(blob, { status: 200, statusText: 'OK' });
}

describe('downloadSingleFile fetch fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    getDownloadAdapter.mockReturnValue(adapter);
    adapter.download.mockResolvedValue(undefined);
    adapter.downloadBlob.mockReset().mockImplementation(async (_blob, _filename, _signal, released) => {released?.();});
    adapter.needsBlobFallback.mockReturnValue(true);
  });

  it('keeps a fetched Blob charged when cancellation settles before native URL release', async () => {
    const budget = new LiveByteBudget(20);
    const controller = new AbortController();
    let nativeRelease: (() => void) | undefined;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(new Uint8Array([1,2,3,4,5,6,7,8]), {status:200}));
    adapter.downloadBlob.mockImplementationOnce((_blob, _name, signal, released) => {
      nativeRelease = released;
      return new Promise<void>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal.reason), {once:true});
      });
    });
    const pending = downloadSingleFile(media, {liveBudget:budget,signal:controller.signal});
    await vi.waitFor(() => expect(nativeRelease).toBeTypeOf('function'));
    controller.abort();
    await expect(pending).resolves.toMatchObject({success:false});
    expect(budget.usedBytes).toBe(8);
    await expect(downloadSingleFile(media, {liveBudget:budget,blob:new Blob(['1234567890123'])})).resolves.toMatchObject({success:false});
    expect(budget.usedBytes).toBe(8);
    nativeRelease?.();
    expect(budget.usedBytes).toBe(0);
    await expect(downloadSingleFile(media, {liveBudget:budget})).resolves.toMatchObject({success:true});
    expect(budget.usedBytes).toBe(0);
    expect(adapter.download).not.toHaveBeenCalled();
  });

  it('rejects an HTTP media URL before any privileged adapter call', async () => {
    await expect(
      downloadSingleFile({ ...media, url: 'http://video.twimg.com/ext_tw_video/123/video.mp4' })
    ).resolves.toEqual({ success: false, error: 'Invalid media download URL' });

    expect(adapter.download).not.toHaveBeenCalled();
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
  });

  it('uses one fetch-to-blob path and preserves progress phase order without a caller signal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulResponse());
    const onProgress = vi.fn();

    await expect(downloadSingleFile(media, { onProgress })).resolves.toMatchObject({
      success: true,
    });

    expect(adapter.downloadBlob).toHaveBeenCalledOnce();
    expect(adapter.download).not.toHaveBeenCalled();
    expect(onProgress.mock.calls.map(([progress]) => progress.phase)).toEqual([
      'preparing',
      'downloading',
      'complete',
    ]);
  });

  it('returns a resource failure without an alternate download for an oversized response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), {
        status: 200,
        headers: {
          'content-length': String(SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES + 1),
        },
      })
    );

    await expect(downloadSingleFile(media)).resolves.toMatchObject({ success: false, code: 'RESOURCE_LIMIT', error: expect.stringContaining('limit') });

    expect(adapter.downloadBlob).not.toHaveBeenCalled();
    expect(adapter.download).not.toHaveBeenCalled();
  });

  it('cleans caller, timeout, and adapter-race abort listeners after a successful download', async () => {
    const timeoutController = new AbortController();
    const callerController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    const callerAdd = vi.spyOn(callerController.signal, 'addEventListener');
    const callerRemove = vi.spyOn(callerController.signal, 'removeEventListener');
    const timeoutAdd = vi.spyOn(timeoutController.signal, 'addEventListener');
    const timeoutRemove = vi.spyOn(timeoutController.signal, 'removeEventListener');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulResponse());

    await expect(
      downloadSingleFile(media, { signal: callerController.signal })
    ).resolves.toMatchObject({ success: true });

    expect(callerAdd).toHaveBeenCalledTimes(2);
    expect(callerRemove).toHaveBeenCalledTimes(2);
    expect(timeoutAdd).toHaveBeenCalledTimes(1);
    expect(timeoutRemove).toHaveBeenCalledTimes(1);
  });

  it('cleans combined abort listeners when fetch returns an HTTP failure', async () => {
    const timeoutController = new AbortController();
    const callerController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    const callerRemove = vi.spyOn(callerController.signal, 'removeEventListener');
    const timeoutRemove = vi.spyOn(timeoutController.signal, 'removeEventListener');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    await expect(
      downloadSingleFile(media, { signal: callerController.signal })
    ).resolves.toEqual({ success: false, error: 'HTTP 403: Forbidden' });

    expect(callerRemove).toHaveBeenCalledTimes(1);
    expect(timeoutRemove).toHaveBeenCalledTimes(1);
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
    expect(adapter.download).not.toHaveBeenCalled();
  });

  it('uses the direct-download fallback when the internal fetch timeout expires', async () => {
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });

    const pending = downloadSingleFile(media);
    timeoutController.abort(new DOMException('Fetch timeout', 'TimeoutError'));

    await expect(pending).resolves.toMatchObject({ success: true });
    expect(adapter.download).toHaveBeenCalledOnce();
  });

  it('returns the timeout failure when both fetch and direct fallback fail', async () => {
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });
    adapter.download.mockRejectedValueOnce(new Error('Direct fallback failed'));

    const pending = downloadSingleFile(media);
    timeoutController.abort(new DOMException('Fetch timeout', 'TimeoutError'));

    await expect(pending).resolves.toEqual({
      success: false,
      error: `Download fetch timed out after ${DEFAULT_REQUEST_TIMEOUT_MS}ms`,
    });
  });

  it('treats caller abort during fetch as cancellation without direct fallback', async () => {
    const timeoutController = new AbortController();
    const callerController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });

    const pending = downloadSingleFile(media, { signal: callerController.signal });
    callerController.abort(new DOMException('User cancelled', 'AbortError'));

    await expect(pending).resolves.toEqual({
      success: false,
      error: USER_CANCELLED_MESSAGE,
    });
    expect(adapter.download).not.toHaveBeenCalled();
    expect(adapter.downloadBlob).not.toHaveBeenCalled();
  });

  it('reports caller cancellation while the direct-download fallback is running', async () => {
    const timeoutController = new AbortController();
    const callerController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });
    adapter.download.mockImplementationOnce((_url, _filename, _headers, signal) => {
      return new Promise<void>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
      });
    });

    const pending = downloadSingleFile(media, { signal: callerController.signal });
    timeoutController.abort(new DOMException('Fetch timeout', 'TimeoutError'));
    await vi.waitFor(() => expect(adapter.download).toHaveBeenCalledOnce());

    callerController.abort();

    await expect(pending).resolves.toEqual({
      success: false,
      error: USER_CANCELLED_MESSAGE,
    });
  });
  it('retains cancelled native Blob ownership across orchestrator restart until URL release', async () => {
    const budget = new LiveByteBudget(10);
    const controller = new AbortController();
    let releaseNative: (() => void) | undefined;
    adapter.downloadBlob.mockImplementationOnce((_blob, _filename, signal, released) => {
      releaseNative = released;
      return new Promise<void>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal.reason), {once:true});
      });
    });
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const pending = orchestrator.downloadSingle(media, {blob:new Blob(['12345678']), liveBudget:budget, signal:controller.signal});
    await vi.waitFor(() => expect(releaseNative).toBeTypeOf('function'));
    controller.abort();
    await expect(pending).resolves.toMatchObject({success:false});
    expect(budget.usedBytes).toBe(8);
    orchestrator.destroy();
    orchestrator.initialize();
    const rejected = await orchestrator.downloadSingle(media, {blob:new Blob(['123']), liveBudget:budget});
    expect(rejected).toMatchObject({success:false,error:expect.stringContaining('memory limit')});
    expect(budget.usedBytes).toBe(8);
    releaseNative?.();
    expect(budget.usedBytes).toBe(0);
    await expect(orchestrator.downloadSingle(media, {blob:new Blob(['ok']), liveBudget:budget})).resolves.toMatchObject({success:true});
    expect(budget.usedBytes).toBe(0);
    expect(adapter.download).not.toHaveBeenCalled();
  });

});
