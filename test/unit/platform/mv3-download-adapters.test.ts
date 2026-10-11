import { DOWNLOAD_TIMEOUT_MS } from '@constants/performance';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMessage } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
}));

vi.mock('@platform/chrome-runtime', () => ({
  browserApi: {
    runtime: { sendMessage },
  },
}));

import { MV3DownloadAdapter } from '@platform/mv3-download-adapters';

describe('MV3DownloadAdapter', () => {
  beforeEach(() => {
    sendMessage.mockReset();
    sendMessage.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function mockBlobUrls(): { revoke: ReturnType<typeof vi.fn> } {
    const revoke = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL(): string { return 'blob:https://x.com/native-resource'; }
      static override revokeObjectURL(url: string): void { revoke(url); }
    });
    return { revoke };
  }

  it('cancels locally and reconciles when sending the native cancel throws synchronously', async () => {
    vi.useFakeTimers();
    const { revoke } = mockBlobUrls();
    const released = vi.fn();
    const controller = new AbortController();
    sendMessage.mockImplementation((message: {type:string;payload:{requestId:string}}) => {
      if (message.type === 'DOWNLOAD_BLOB_URL_REQUEST') return new Promise(() => undefined);
      if (message.type === 'DOWNLOAD_CANCEL_REQUEST') throw new Error('Runtime unavailable');
      return Promise.resolve({success:true,data:{requestId:message.payload.requestId,status:'terminal'}});
    });
    const pending = new MV3DownloadAdapter().downloadBlob(new Blob(['a']), 'a.txt', controller.signal, released);
    const observed = pending.catch((error: unknown) => error);
    controller.abort();
    expect(await observed).toMatchObject({name:'AbortError'});
    await vi.advanceTimersByTimeAsync(2000);
    expect(revoke).toHaveBeenCalledOnce();
    expect(released).toHaveBeenCalledOnce();
  });

  it('retains the object URL and owner through an active native download after a failed response', async () => {
    vi.useFakeTimers();
    const { revoke } = mockBlobUrls();
    const released = vi.fn();
    let status = 'active';
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_BLOB_URL_REQUEST') {
        return Promise.resolve({
          success: false,
          error: 'Download timed out',
          data: { requestId: message.payload.requestId, terminal: false },
        });
      }
      return Promise.resolve({
        success: true,
        data: { requestId: message.payload.requestId, status },
      });
    });

    const adapter = new MV3DownloadAdapter();
    await expect(adapter.downloadBlob(new Blob(['native']), 'native.txt', undefined, released))
      .rejects.toThrow('Download timed out');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(revoke).not.toHaveBeenCalled();
    expect(released).not.toHaveBeenCalled();

    status = 'terminal';
    await vi.advanceTimersByTimeAsync(1_000);
    expect(revoke).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(7_000);
    expect(revoke).toHaveBeenCalledOnce();
    expect(released).toHaveBeenCalledOnce();
    expect(sendMessage.mock.calls.some(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_BLOB_STATUS_REQUEST')).toBe(true);
  });

  it('holds an ambiguous abort until an exact terminal status is confirmed', async () => {
    vi.useFakeTimers();
    const { revoke } = mockBlobUrls();
    const released = vi.fn();
    const controller = new AbortController();
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_BLOB_URL_REQUEST') return new Promise(() => undefined);
      if (message.type === 'DOWNLOAD_CANCEL_REQUEST') return Promise.resolve({ success: true });
      return Promise.resolve({
        success: true,
        data: { requestId: message.payload.requestId, status: 'unknown' },
      });
    });

    const adapter = new MV3DownloadAdapter();
    const pending = adapter.downloadBlob(new Blob(['native']), 'native.txt', controller.signal, released);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(revoke).not.toHaveBeenCalled();
    expect(released).not.toHaveBeenCalled();
    expect(sendMessage.mock.calls.some(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_CANCEL_REQUEST')).toBe(true);
    expect(sendMessage.mock.calls.some(([message]) =>
      (message as { type: string; payload: { cancelRequested?: boolean } }).type ===
        'DOWNLOAD_BLOB_STATUS_REQUEST' &&
      (message as { payload: { cancelRequested?: boolean } }).payload.cancelRequested === true
    )).toBe(true);
  });

  it('releases a known terminal failure once after the delay', async () => {
    vi.useFakeTimers();
    const { revoke } = mockBlobUrls();
    const released = vi.fn();
    sendMessage.mockImplementation((message: { payload: { requestId: string } }) =>
      Promise.resolve({
        success: false,
        error: 'Download interrupted',
        data: { requestId: message.payload.requestId, terminal: true },
      })
    );

    await expect(new MV3DownloadAdapter().downloadBlob(
      new Blob(['native']), 'native.txt', undefined, released
    )).rejects.toThrow('Download interrupted');
    await vi.advanceTimersByTimeAsync(1_999);
    expect(revoke).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(revoke).toHaveBeenCalledOnce();
    expect(released).toHaveBeenCalledOnce();
  });

  it('releases an aborted or undispatched Blob without starting a native request', async () => {
    vi.useFakeTimers();
    const { revoke } = mockBlobUrls();
    const adapter = new MV3DownloadAdapter();
    const controller = new AbortController();
    controller.abort();
    const abortedRelease = vi.fn();
    await expect(adapter.downloadBlob(new Blob(['native']), 'native.txt', controller.signal,
      abortedRelease)).rejects.toMatchObject({ name: 'AbortError' });
    expect(abortedRelease).toHaveBeenCalledOnce();
    expect(sendMessage).not.toHaveBeenCalled();

    const undispatchedRelease = vi.fn();
    sendMessage.mockImplementationOnce(() => { throw new Error('No message channel'); });
    await expect(adapter.downloadBlob(new Blob(['native']), 'native.txt', undefined,
      undispatchedRelease)).rejects.toThrow('No message channel');
    await vi.advanceTimersByTimeAsync(2_000);
    expect(revoke).toHaveBeenCalledOnce();
    expect(undispatchedRelease).toHaveBeenCalledOnce();
  });

  it('releases ownership when createObjectURL fails before dispatch', async () => {
    const released = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static override createObjectURL(): string { throw new Error('Blob URL unavailable'); }
    });

    await expect(new MV3DownloadAdapter().downloadBlob(
      new Blob(['native']), 'native.txt', undefined, released
    )).rejects.toThrow('Blob URL unavailable');
    expect(released).toHaveBeenCalledOnce();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('does not send a cancellation for a download that never started', async () => {
    const controller = new AbortController();
    controller.abort();
    const adapter = new MV3DownloadAdapter();

    await expect(
      adapter.download('https://pbs.twimg.com/media/example.jpg', 'example.jpg', undefined, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('reconciles a lost reply to the original completed ID without redispatch', async () => {
    const url = 'https://pbs.twimg.com/media/example.jpg';
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_REQUEST') return Promise.reject(new Error('Worker reply lost'));
      return Promise.resolve({ success: true, data: { requestId: message.payload.requestId, status: 'complete' } });
    });

    await expect(new MV3DownloadAdapter().download(url, 'example.jpg')).resolves.toBeUndefined();
    expect(sendMessage.mock.calls.filter(([message]) => (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
    expect(sendMessage.mock.calls[0]?.[0]).toMatchObject({
      type: 'DOWNLOAD_REQUEST', payload: { url, filename: 'example.jpg', mode: 'direct' },
    });
  });

  it.each(['active reply', 'lost reply'])(
    'waits past the initial checks for one %s download to complete',
    async (replyKind) => {
      vi.useFakeTimers();
      let nativeStatus = 'active';
      const url = 'https://pbs.twimg.com/media/example.jpg';
      sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
        if (message.type === 'DOWNLOAD_REQUEST') {
          return replyKind === 'lost reply'
            ? Promise.reject(new Error('Worker reply lost'))
            : Promise.resolve({
                success: false,
                data: { requestId: message.payload.requestId, status: 'active' },
              });
        }
        return Promise.resolve({
          success: true,
          data: { requestId: message.payload.requestId, status: nativeStatus },
        });
      });

      let settled = false;
      const pending = new MV3DownloadAdapter().download(url, 'example.jpg').finally(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(4_000);
      expect(settled).toBe(false);
      expect(sendMessage.mock.calls.filter(([message]) =>
        (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);

      nativeStatus = 'complete';
      await vi.advanceTimersByTimeAsync(5_000);
      await expect(pending).resolves.toBeUndefined();
      expect(sendMessage.mock.calls.filter(([message]) =>
        (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
    }
  );

  it('reports a terminal interrupted download without a Blob replacement', async () => {
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_REQUEST') return Promise.reject(new Error('Worker reply lost'));
      return Promise.resolve({ success: true, data: { requestId: message.payload.requestId, status: 'interrupted' } });
    });

    await expect(new MV3DownloadAdapter().download(
      'https://pbs.twimg.com/media/example.jpg', 'example.jpg'
    )).rejects.toThrow('Browser download was interrupted');
    expect(sendMessage.mock.calls.filter(([message]) => (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
  });

  it('cancels the original request while an active download remains pending', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_REQUEST') return Promise.reject(new Error('Worker reply lost'));
      if (message.type === 'DOWNLOAD_CANCEL_REQUEST') return Promise.resolve({ success: true });
      return Promise.resolve({ success: true, data: { requestId: message.payload.requestId, status: 'active' } });
    });
    const adapter = new MV3DownloadAdapter();
    const pending = adapter.download(
      'https://pbs.twimg.com/media/example.jpg', 'example.jpg', undefined, controller.signal
    );
    let settled = false;
    const outcome = pending.catch((error: unknown) => {
      settled = true;
      return error;
    });
    await vi.advanceTimersByTimeAsync(4_000);
    expect(settled).toBe(false);

    const firstMessage = sendMessage.mock.calls[0]?.[0] as {
      payload: { requestId: string };
    };
    controller.abort();
    expect(await outcome).toMatchObject({ name: 'AbortError' });

    expect(sendMessage.mock.calls.find(([message]) => (message as { type: string }).type === 'DOWNLOAD_CANCEL_REQUEST')?.[0]).toEqual({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId: firstMessage.payload.requestId, url: 'https://pbs.twimg.com/media/example.jpg' },
    });
    expect(sendMessage.mock.calls.filter(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
  });

  it('keeps an unknown original request cancellable after the bounded checks settle', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_REQUEST') return Promise.reject(new Error('Worker reply lost'));
      if (message.type === 'DOWNLOAD_CANCEL_REQUEST') return Promise.resolve({ success: true });
      return Promise.resolve({
        success: true,
        data: { requestId: message.payload.requestId, status: 'unknown' },
      });
    });

    const pending = new MV3DownloadAdapter().download(
      'https://pbs.twimg.com/media/example.jpg', 'example.jpg', undefined, controller.signal
    );
    const outcome = expect(pending).rejects.toThrow('Browser download state is unknown');
    await vi.advanceTimersByTimeAsync(4_000);
    await outcome;

    const request = sendMessage.mock.calls[0]?.[0] as { payload: { requestId: string } };
    controller.abort();
    expect(sendMessage.mock.calls.find(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_CANCEL_REQUEST')?.[0]).toEqual({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: {
        requestId: request.payload.requestId,
        url: 'https://pbs.twimg.com/media/example.jpg',
      },
    });
    expect(sendMessage.mock.calls.filter(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
  });

  it('requests cancellation of the active original when the deadline expires', async () => {
    vi.useFakeTimers();
    sendMessage.mockImplementation((message: { type: string; payload: { requestId: string } }) => {
      if (message.type === 'DOWNLOAD_REQUEST') return Promise.reject(new Error('Worker reply lost'));
      if (message.type === 'DOWNLOAD_CANCEL_REQUEST') return Promise.resolve({ success: true });
      return Promise.resolve({
        success: true,
        data: { requestId: message.payload.requestId, status: 'active' },
      });
    });

    const pending = new MV3DownloadAdapter().download(
      'https://pbs.twimg.com/media/example.jpg', 'example.jpg'
    );
    const outcome = expect(pending).rejects.toThrow('Browser download state is unknown');
    await vi.advanceTimersByTimeAsync(DOWNLOAD_TIMEOUT_MS);
    await outcome;

    const request = sendMessage.mock.calls[0]?.[0] as { payload: { requestId: string } };
    expect(sendMessage.mock.calls.find(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_CANCEL_REQUEST')?.[0]).toEqual({
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: {
        requestId: request.payload.requestId,
        url: 'https://pbs.twimg.com/media/example.jpg',
      },
    });
    expect(sendMessage.mock.calls.filter(([message]) =>
      (message as { type: string }).type === 'DOWNLOAD_REQUEST')).toHaveLength(1);
  });
});
