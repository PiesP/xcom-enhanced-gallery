import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Userscript Adapter – 경계 가드', () => {
  const originalFetch = globalThis.fetch;
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  const originalGMInfo = (globalThis as unknown as Record<string, unknown>).GM_info;
  const originalGMDownload = (globalThis as unknown as Record<string, unknown>).GM_download;
  const originalGMXhr = (globalThis as unknown as Record<string, unknown>).GM_xmlhttpRequest;

  beforeEach(() => {
    // reset GM_* - delete properties to ensure they're truly absent
    delete (globalThis as unknown as Record<string, unknown>).GM_download;
    delete (globalThis as unknown as Record<string, unknown>).GM_xmlhttpRequest;
    delete (globalThis as unknown as Record<string, unknown>).GM_info;
    delete (globalThis as unknown as Record<string, unknown>).GM_setValue;
    delete (globalThis as unknown as Record<string, unknown>).GM_getValue;
    delete (globalThis as unknown as Record<string, unknown>).GM_deleteValue;
    delete (globalThis as unknown as Record<string, unknown>).GM_listValues;

    // Clear adapter module cache to force re-evaluation
    vi.resetModules();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    (globalThis as unknown as Record<string, unknown>).GM_info = originalGMInfo;
    (globalThis as unknown as Record<string, unknown>).GM_download = originalGMDownload;
    (globalThis as unknown as Record<string, unknown>).GM_xmlhttpRequest = originalGMXhr;
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('GM_* 미존재 환경에서 안전한 기본 속성을 제공한다', async () => {
    // Dynamic import after GM_* reset
    const { default: getUserscript } = await import(
      '../../../../src/shared/external/userscript/adapter'
    );
    const api = getUserscript();
    expect(api.hasGM).toBe(false);
    expect(['unknown', 'tampermonkey', 'greasemonkey', 'violentmonkey']).toContain(api.manager);
    // info()는 환경에 따라 null 또는 객체를 반환할 수 있으므로 안전성만 검증한다
    const info = api.info();
    expect(info === null || typeof info === 'object').toBe(true);
    expect(typeof api.download).toBe('function');
    expect(typeof api.xhr).toBe('function');
  });

  it('fallback download가 안전하게 fetch + Blob URL을 사용한다 (GM_download 없음)', async () => {
    const BlobCtor: any = (globalThis as unknown as Record<string, unknown>).Blob;
    const ResponseCtor: any = (globalThis as unknown as Record<string, unknown>).Response;
    const blob = new BlobCtor([new Uint8Array([1, 2, 3])], {
      type: 'application/octet-stream',
    });
    // Mock fetch → Blob
    globalThis.fetch = vi.fn(async () => new ResponseCtor(blob, { status: 200 })) as any;

    const objectUrl = 'blob://test';
    const revokeSpy = vi.spyOn(globalThis.URL, 'revokeObjectURL');
    const createObjSpy = vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue(objectUrl);

    const { default: getUserscript } = await import(
      '../../../../src/shared/external/userscript/adapter'
    );
    const api = getUserscript();
    await expect(api.download('https://example.com/foo.bin', 'foo.bin')).resolves.toBeUndefined();

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(createObjSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith(objectUrl);
  });

  it('GM_download가 존재하면 이를 우선 사용한다(실패 시 fallback)', async () => {
    const gmDownloadMock = vi.fn(() => {
      // simulate GM_download success – do nothing
    });
    (globalThis as unknown as Record<string, unknown>).GM_download = gmDownloadMock;

    const { default: getUserscript } = await import(
      '../../../../src/shared/external/userscript/adapter'
    );
    const api = getUserscript();
    await expect(api.download('https://example.com/img.jpg', 'img.jpg')).resolves.toBeUndefined();
    expect(gmDownloadMock).toHaveBeenCalledWith('https://example.com/img.jpg', 'img.jpg');

    // When GM_download throws, fallback should engage and use fetch
    gmDownloadMock.mockImplementationOnce(() => {
      throw new Error('GM failed');
    });
    const BlobCtor2: any = (globalThis as unknown as Record<string, unknown>).Blob;
    const ResponseCtor2: any = (globalThis as unknown as Record<string, unknown>).Response;
    const blob = new BlobCtor2([new Uint8Array([0])]);
    globalThis.fetch = vi.fn(async () => new ResponseCtor2(blob)) as any;
    const createObjSpy = vi
      .spyOn(globalThis.URL, 'createObjectURL')
      .mockReturnValue('blob://fallback');
    // Phase 74.7: URL.revokeObjectURL 모킹 추가 (JSDOM 환경에서 fallback download 지원)
    const revokeSpy = vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {});

    await expect(api.download('https://example.com/img2.jpg', 'img2.jpg')).resolves.toBeUndefined();
    expect(createObjSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalledWith('blob://fallback');
  });

  it('xhr: GM_xmlhttpRequest가 없으면 fetch 기반 fallback이 onload를 호출한다', async () => {
    const payload = { ok: true, value: 42 };
    const ResponseCtor3: any = (globalThis as unknown as Record<string, unknown>).Response;
    globalThis.fetch = vi.fn(
      async () =>
        new ResponseCtor3(JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json' },
        })
    ) as any;

    const { default: getUserscript } = await import(
      '../../../../src/shared/external/userscript/adapter'
    );
    const api = getUserscript();
    const onload = vi.fn();
    const onerror = vi.fn();
    const onloadend = vi.fn();

    const handle = api.xhr({
      url: 'https://example.com/api',
      method: 'GET',
      responseType: 'json',
      onload,
      onerror,
      onloadend,
    } as never);

    expect(handle).toBeDefined();

    // flush async chain (fetch → then → callbacks)
    await new Promise<void>(r => setTimeout(r, 0));

    expect(onload).toHaveBeenCalledTimes(1);
    expect(onerror).not.toHaveBeenCalled();
    expect(onloadend).toHaveBeenCalledTimes(1);
    const arg = onload.mock.calls[0][0] as any;
    expect(arg.status).toBe(200);
    expect(arg.response).toEqual(payload);
  });

  it('xhr: GM_xmlhttpRequest가 존재하면 해당 API를 사용한다', async () => {
    const gmXhrMock = vi.fn(() => ({ abort: vi.fn() }));
    (globalThis as unknown as Record<string, unknown>).GM_xmlhttpRequest =
      gmXhrMock as unknown as typeof globalThis.GM_xmlhttpRequest;

    const { default: getUserscript } = await import(
      '../../../../src/shared/external/userscript/adapter'
    );
    const api = getUserscript();
    const handle = api.xhr({ url: 'https://example.com/x', method: 'HEAD' } as never);
    expect(handle).toBeDefined();
    expect(gmXhrMock).toHaveBeenCalled();
  });
});
