import type {
  GMDownloadDetails,
  GMXMLHttpRequestDetails,
} from '@shared/types/core/userscript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_MAX_RESPONSE_BYTES = 8;

vi.mock('@constants/performance', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@constants/performance')>()),
  SINGLE_DOWNLOAD_MAX_RESPONSE_BYTES: TEST_MAX_RESPONSE_BYTES,
}));

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
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
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

  it('uses the cancellable fallback instead of legacy GM_download when a signal is supplied', async () => {
    const legacyDownload = vi.fn();
    const abortRequest = vi.fn();
    const xmlHttpRequest = vi.fn(() => ({ abort: abortRequest }));
    userscriptGlobals.GM_download = legacyDownload;
    userscriptGlobals.GM_xmlhttpRequest = xmlHttpRequest;
    const controller = new AbortController();
    const api = await loadUserscriptAdapter();

    const pending = api.download(
      'https://pbs.twimg.com/media/image.jpg',
      'image.jpg',
      controller.signal
    );
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(legacyDownload).not.toHaveBeenCalled();
    expect(xmlHttpRequest).toHaveBeenCalledOnce();
    expect(abortRequest).toHaveBeenCalledOnce();
  });

  it('keeps legacy GM_download for callers that do not request cancellation', async () => {
    const legacyDownload = vi.fn((details: GMDownloadDetails) => details.onload?.());
    const xmlHttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    userscriptGlobals.GM_download = legacyDownload as unknown as typeof GM_download;
    userscriptGlobals.GM_xmlhttpRequest = xmlHttpRequest;
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).resolves.toBeUndefined();

    expect(legacyDownload).toHaveBeenCalledOnce();
    expect(xmlHttpRequest).not.toHaveBeenCalled();
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
    const { downloadLiveByteBudget } = await import('@shared/services/download/live-byte-budget');

    await expect(
      api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).resolves.toBeUndefined();

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(downloadLiveByteBudget.usedBytes).toBe(5);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(downloadLiveByteBudget.usedBytes).toBe(5);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-download');
    expect(downloadLiveByteBudget.usedBytes).toBe(0);
  });

  it('holds a GM response reservation until a late load callback after caller abort', async () => {
    let request: GMXMLHttpRequestDetails | undefined;
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      request = details;
      return { abort: vi.fn() };
    });
    const controller = new AbortController();
    const api = await loadUserscriptAdapter();
    const { downloadLiveByteBudget } = await import('@shared/services/download/live-byte-budget');

    const pending = api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg', controller.signal);
    expect(downloadLiveByteBudget.usedBytes).toBe(2 * TEST_MAX_RESPONSE_BYTES);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(downloadLiveByteBudget.usedBytes).toBe(2 * TEST_MAX_RESPONSE_BYTES);
    request?.onload?.({ status: 200, response: new Blob(['late']) } as never);
    expect(downloadLiveByteBudget.usedBytes).toBe(0);
  });

  it('holds a GM response reservation after an oversized progress report until abort settles', async () => {
    let request: GMXMLHttpRequestDetails | undefined;
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      request = details;
      return { abort: vi.fn() };
    });
    const api = await loadUserscriptAdapter();
    const { downloadLiveByteBudget } = await import('@shared/services/download/live-byte-budget');

    const pending = api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg');
    request?.onprogress?.({ loaded: TEST_MAX_RESPONSE_BYTES + 1, total: 0,
      lengthComputable: false } as never);
    await expect(pending).rejects.toMatchObject({ name: 'HttpResponseSizeLimitError' });
    expect(downloadLiveByteBudget.usedBytes).toBe(2 * TEST_MAX_RESPONSE_BYTES);
    request?.onabort?.({} as never);
    expect(downloadLiveByteBudget.usedBytes).toBe(0);
  });

  it('holds a Blob URL lease through the anchor microtask and BFCache entry', async () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-owned-download');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const released = vi.fn();
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    const api = await loadUserscriptAdapter();

    await api.downloadBlob(new Blob(['owned']), 'original-name.jpg', undefined, released);
    expect(revoke).not.toHaveBeenCalled();
    expect(released).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    expect(released).not.toHaveBeenCalled();
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false }));
    expect(revoke).toHaveBeenCalledWith('blob:test-owned-download');
    expect(released).toHaveBeenCalledOnce();
  });

  it('returns ownership exactly once for a pre-aborted or URL creation failure', async () => {
    userscriptGlobals.GM_xmlhttpRequest = vi.fn(() => ({ abort: vi.fn() }));
    const api = await loadUserscriptAdapter();
    const controller = new AbortController();
    controller.abort();
    const preAbortedRelease = vi.fn();
    await expect(api.downloadBlob(new Blob(['owned']), 'name.jpg', controller.signal,
      preAbortedRelease)).rejects.toMatchObject({ name: 'AbortError' });
    expect(preAbortedRelease).toHaveBeenCalledOnce();

    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => { throw new Error('URL unavailable'); });
    const failedRelease = vi.fn();
    await expect(api.downloadBlob(new Blob(['owned']), 'name.jpg', undefined,
      failedRelease)).rejects.toThrow('URL unavailable');
    expect(failedRelease).toHaveBeenCalledOnce();
  });

  it('clicks the Blob fallback anchor inside the open gallery container', async () => {
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'xeg-gallery-root';
    document.body.append(galleryContainer);
    let clickParent: Element | null = null;
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        clickParent = this.parentElement;
      });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-gallery-download');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
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
      api.download(
        'https://pbs.twimg.com/media/image.jpg',
        'image.jpg',
        new AbortController().signal
      )
    ).resolves.toBeUndefined();

    expect(click).toHaveBeenCalledOnce();
    expect(clickParent).toBe(galleryContainer);
  });

  it('aborts the Blob fallback when streamed bytes exceed the response limit', async () => {
    const abortRequest = vi.fn();
    let request: GMXMLHttpRequestDetails | undefined;
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      request = details;
      return { abort: abortRequest };
    });
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');
    const api = await loadUserscriptAdapter();

    const pending = api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg');
    request?.onprogress?.({
      lengthComputable: false,
      loaded: TEST_MAX_RESPONSE_BYTES + 1,
      total: 0,
    } as never);

    await expect(pending).rejects.toMatchObject({
      name: 'HttpResponseSizeLimitError',
      maxBytes: TEST_MAX_RESPONSE_BYTES,
      receivedBytes: TEST_MAX_RESPONSE_BYTES + 1,
    });
    expect(abortRequest).toHaveBeenCalledOnce();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('aborts the Blob fallback when the declared total exceeds the response limit', async () => {
    const abortRequest = vi.fn();
    let request: GMXMLHttpRequestDetails | undefined;
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      request = details;
      return { abort: abortRequest };
    });
    const api = await loadUserscriptAdapter();

    const pending = api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg');
    request?.onprogress?.({
      lengthComputable: true,
      loaded: 1,
      total: TEST_MAX_RESPONSE_BYTES + 1,
    } as never);
    request?.onprogress?.({
      lengthComputable: true,
      loaded: TEST_MAX_RESPONSE_BYTES + 2,
      total: TEST_MAX_RESPONSE_BYTES + 2,
    } as never);

    await expect(pending).rejects.toMatchObject({
      name: 'HttpResponseSizeLimitError',
      maxBytes: TEST_MAX_RESPONSE_BYTES,
      receivedBytes: TEST_MAX_RESPONSE_BYTES + 1,
    });
    expect(abortRequest).toHaveBeenCalledOnce();
  });

  it('rejects an oversized final Blob when progress metadata is unavailable', async () => {
    const abortRequest = vi.fn();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');
    userscriptGlobals.GM_xmlhttpRequest = vi.fn((details) => {
      queueMicrotask(() =>
        details.onload?.({
          status: 200,
          statusText: 'OK',
          response: new Blob(['123456789']),
        } as never)
      );
      return { abort: abortRequest };
    });
    const api = await loadUserscriptAdapter();

    await expect(
      api.download('https://pbs.twimg.com/media/image.jpg', 'image.jpg')
    ).rejects.toMatchObject({
      name: 'HttpResponseSizeLimitError',
      maxBytes: TEST_MAX_RESPONSE_BYTES,
      receivedBytes: TEST_MAX_RESPONSE_BYTES + 1,
    });
    expect(abortRequest).toHaveBeenCalledOnce();
    expect(createObjectURL).not.toHaveBeenCalled();
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
    expect(removeEventListener).toHaveBeenCalledOnce();
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
