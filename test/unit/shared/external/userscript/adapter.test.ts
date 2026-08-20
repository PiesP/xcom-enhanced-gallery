import type {
  GMDownloadDetails,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type UserscriptGlobals = typeof globalThis & {
  GM?: { download?: (details: GMDownloadDetails) => unknown };
  GM_download?: typeof GM_download;
  GM_xmlhttpRequest?: (details: GMXMLHttpRequestDetails) => { abort: () => void };
};

const userscriptGlobals = globalThis as UserscriptGlobals;
const originalGlobals = {
  GM: userscriptGlobals.GM,
  GM_download: userscriptGlobals.GM_download,
  GM_xmlhttpRequest: userscriptGlobals.GM_xmlhttpRequest,
};

function restoreUserscriptGlobals(): void {
  if (originalGlobals.GM) userscriptGlobals.GM = originalGlobals.GM;
  else delete userscriptGlobals.GM;
  if (originalGlobals.GM_download) userscriptGlobals.GM_download = originalGlobals.GM_download;
  else delete userscriptGlobals.GM_download;
  if (originalGlobals.GM_xmlhttpRequest) {
    userscriptGlobals.GM_xmlhttpRequest = originalGlobals.GM_xmlhttpRequest;
  } else {
    delete userscriptGlobals.GM_xmlhttpRequest;
  }
}

async function loadUserscriptAdapter() {
  vi.resetModules();
  return (await import('@shared/external/userscript/adapter')).getUserscript();
}

describe('userscript download adapter failure handling', () => {
  beforeEach(() => {
    delete userscriptGlobals.GM;
    delete userscriptGlobals.GM_download;
    delete userscriptGlobals.GM_xmlhttpRequest;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreUserscriptGlobals();
  });

  it('aborts a modern GM.download handle and removes the signal listener', async () => {
    const abortDownload = vi.fn();
    userscriptGlobals.GM = { download: vi.fn(() => ({ abort: abortDownload })) };
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    const controller = new AbortController();
    const addEventListener = vi.spyOn(controller.signal, 'addEventListener');
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');
    const api = await loadUserscriptAdapter();

    const pending = api.download(
      'https://video.twimg.com/ext_tw_video/123/video.mp4',
      'video.mp4',
      controller.signal
    );
    const outcome = pending.then(
      () => 'resolved',
      (error: unknown) => (error instanceof Error ? error.name : String(error))
    );

    controller.abort();

    await expect(
      Promise.race([
        outcome,
        new Promise<string>((resolve) => setTimeout(() => resolve('still-pending'), 0)),
      ])
    ).resolves.toBe('AbortError');
    expect(abortDownload).toHaveBeenCalledOnce();
    expect(addEventListener).toHaveBeenCalledWith('abort', expect.any(Function), { once: true });
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('observes a Promise-based GM.download rejection even when callbacks are not invoked', async () => {
    const error = new Error('download permission denied');
    const handle = {
      abort: vi.fn(),
      then: vi.fn(
        (
          _resolve: ((value: unknown) => unknown) | undefined,
          reject: (reason: unknown) => unknown
        ): void => queueMicrotask(() => reject(error))
      ),
    };
    userscriptGlobals.GM = { download: vi.fn(() => handle) };
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('https://video.twimg.com/ext_tw_video/123/video.mp4', 'video.mp4')
    ).rejects.toThrow(
      'download permission denied'
    );
  });

  it('uses the Blob fallback when GM.download APIs are unavailable', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-download');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      queueMicrotask(() =>
        details.onload?.({
          status: 200,
          statusText: 'OK',
          response: new Blob(['image']),
        } as never)
      );
      return { abort: vi.fn() };
    });
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).resolves.toBeUndefined();

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-download');
  });

  it('rejects an HTTP error instead of saving its response body as media', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      queueMicrotask(() =>
        details.onload?.({
          status: 403,
          statusText: 'Forbidden',
          response: new Blob(['access denied'], { type: 'text/html' }),
        } as never)
      );
      return { abort: vi.fn() };
    });
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).rejects.toThrow(
      'HTTP 403: Forbidden'
    );
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(click).not.toHaveBeenCalled();
  });

  it('aborts an in-flight Blob fallback when the caller cancels', async () => {
    const abortRequest = vi.fn();
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: abortRequest }));
    const controller = new AbortController();
    const removeEventListener = vi.spyOn(controller.signal, 'removeEventListener');
    const api = await loadUserscriptAdapter();

    const pending = api.download(
      'https://pbs.twimg.com/media/image.jpg',
      'image.jpg',
      controller.signal
    );
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(abortRequest).toHaveBeenCalledOnce();
    expect(removeEventListener).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('rejects cleartext media before invoking a privileged userscript API', async () => {
    const gmDownload = vi.fn();
    userscriptGlobals.GM = { download: gmDownload };
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('http://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).rejects.toThrow('Blocked unsafe media download URL');
    expect(gmDownload).not.toHaveBeenCalled();
  });
});
