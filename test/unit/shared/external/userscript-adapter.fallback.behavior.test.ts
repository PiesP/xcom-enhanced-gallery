import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import getUserscript from '../../../../src/shared/external/userscript/adapter';

describe('Userscript Adapter — fallback xhr behavior (no GM_*)', () => {
  const originalFetch = globalThis.fetch;
  const originalGMdl = (globalThis as any).GM_download;
  const originalGMxhr = (globalThis as any).GM_xmlhttpRequest;

  beforeEach(() => {
    (globalThis as any).GM_download = undefined;
    (globalThis as any).GM_xmlhttpRequest = undefined;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).GM_download = originalGMdl;
    (globalThis as any).GM_xmlhttpRequest = originalGMxhr;
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('calls onload (not onerror) for non-2xx HTTP responses and always fires onloadend', async () => {
    const ResponseCtor: any = (globalThis as any).Response;
    globalThis.fetch = vi.fn(async () => new ResponseCtor('Not Found', { status: 404 })) as any;

    const api = getUserscript();
    const onload = vi.fn();
    const onerror = vi.fn();
    const onloadend = vi.fn();

    const handle = api.xhr({
      url: 'https://example.com/missing',
      method: 'GET',
      onload,
      onerror,
      onloadend,
    } as any);

    expect(handle).toBeDefined();
    await new Promise<void>(r => setTimeout(r, 0));

    expect(onload).toHaveBeenCalledTimes(1);
    const arg = onload.mock.calls[0][0] as any;
    expect(arg.status).toBe(404);
    expect(onerror).not.toHaveBeenCalled();
    expect(onloadend).toHaveBeenCalledTimes(1);
  });

  it('fires ontimeout (and onloadend) when timeout elapses without response; no onload/onerror', async () => {
    vi.useFakeTimers();
    // fetch promise that never resolves
    globalThis.fetch = vi.fn(async () => new Promise(() => {})) as any;

    const api = getUserscript();
    const ontimeout = vi.fn();
    const onload = vi.fn();
    const onerror = vi.fn();
    const onloadend = vi.fn();

    api.xhr({
      url: 'https://slow.example.com',
      timeout: 50,
      ontimeout,
      onload,
      onerror,
      onloadend,
    } as any);

    vi.advanceTimersByTime(60);
    vi.runAllTimers();

    expect(ontimeout).toHaveBeenCalledTimes(1);
    expect(onloadend).toHaveBeenCalledTimes(1);
    expect(onload).not.toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
  });

  it('handle.abort() triggers onabort and onloadend; no onload/onerror', async () => {
    vi.useFakeTimers();
    // fetch promise that never resolves
    globalThis.fetch = vi.fn(async () => new Promise(() => {})) as any;

    const api = getUserscript();
    const onabort = vi.fn();
    const onloadend = vi.fn();
    const onload = vi.fn();
    const onerror = vi.fn();

    const handle = api.xhr({
      url: 'https://hang.example.com',
      onabort,
      onloadend,
      onload,
      onerror,
    } as any)!;
    expect(handle).toBeDefined();
    handle.abort();

    // flush queued callbacks driven by timers
    vi.runAllTimers();
    expect(onabort).toHaveBeenCalledTimes(1);
    expect(onloadend).toHaveBeenCalledTimes(1);
    expect(onload).not.toHaveBeenCalled();
    expect(onerror).not.toHaveBeenCalled();
  });

  it('network error calls onerror and onloadend', async () => {
    globalThis.fetch = vi.fn(async () => Promise.reject(new Error('network error'))) as any;

    const api = getUserscript();
    const onerror = vi.fn();
    const onloadend = vi.fn();

    api.xhr({ url: 'https://err.example.com', onerror, onloadend } as any);

    await new Promise<void>(r => setTimeout(r, 0));

    expect(onerror).toHaveBeenCalledTimes(1);
    expect(onloadend).toHaveBeenCalledTimes(1);
  });
});
