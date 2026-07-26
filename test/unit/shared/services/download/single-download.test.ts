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

describe('downloadSingleFile fetch fallback', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getDownloadAdapter.mockReturnValue(adapter);
    adapter.download.mockResolvedValue(undefined);
    adapter.downloadBlob.mockResolvedValue(undefined);
    adapter.needsBlobFallback.mockReturnValue(true);
  });

  it('uses the direct-download fallback when the internal fetch timeout expires', async () => {
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal);
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      });
    });

    const pending = downloadSingleFile({
      id: 'video-1',
      type: 'video',
      url: 'https://video.twimg.com/media/video.mp4',
    });
    timeoutController.abort(new DOMException('Fetch timeout', 'TimeoutError'));

    await expect(pending).resolves.toMatchObject({ success: true });
    expect(adapter.download).toHaveBeenCalledOnce();
  });
});
