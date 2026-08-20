// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { USER_CANCELLED_MESSAGE } from '@shared/error/cancellation';
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES,
} from '@constants/performance';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { adapter, getDownloadAdapter } = vi.hoisted(() => {
  const download = vi.fn(async () => undefined);
  return {
    adapter: {
      download,
      downloadBlob: vi.fn(async () => undefined),
      needsBlobFallback: vi.fn(() => true),
    },
    getDownloadAdapter: vi.fn(),
  };
});

vi.mock('@platform/index', () => ({ getDownloadAdapter }));

import { downloadSingleFile } from '@shared/services/download/single-download';

const media = {
  id: 'video-1',
  type: 'video' as const,
  url: 'https://video.twimg.com/media/video.mp4',
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
    adapter.downloadBlob.mockResolvedValue(undefined);
    adapter.needsBlobFallback.mockReturnValue(true);
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

  it('uses the browser-managed direct fallback instead of buffering an oversized response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Uint8Array([1]), {
        status: 200,
        headers: {
          'content-length': String(SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES + 1),
        },
      })
    );

    await expect(downloadSingleFile(media)).resolves.toMatchObject({ success: true });

    expect(adapter.downloadBlob).not.toHaveBeenCalled();
    expect(adapter.download).toHaveBeenCalledOnce();
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
});
