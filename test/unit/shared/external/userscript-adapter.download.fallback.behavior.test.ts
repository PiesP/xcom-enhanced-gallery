import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import getUserscript, {
  setUserscriptNetworkPolicy,
} from '../../../../src/shared/external/userscript/adapter';

describe('Userscript Adapter – download fallback behavior', () => {
  const originalFetch = globalThis.fetch;
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    (globalThis as unknown as Record<string, unknown>).GM_download = undefined;
    (globalThis as unknown as Record<string, unknown>).GM_xmlhttpRequest = undefined;
    // reset network policy to defaults (disabled)
    setUserscriptNetworkPolicy({ enabled: false, allowlist: [] });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.URL.createObjectURL = originalCreateObjectURL;
    globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
    // restore document in case a test mutated it
    (globalThis as unknown as Record<string, unknown>).document = originalDocument as unknown;
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('policy block: when allowlist blocks, download() rejects with blocked_by_network_policy', async () => {
    setUserscriptNetworkPolicy({ enabled: true, allowlist: [] });
    const api = getUserscript();
    await expect(
      api.download('https://not-allowed.example/asset.bin', 'asset.bin')
    ).rejects.toThrow(/blocked_by_network_policy/);
  });

  it('non-2xx response should reject with http_<status> error', async () => {
    const ResponseCtor: any = (globalThis as unknown as Record<string, unknown>).Response;
    globalThis.fetch = vi.fn(
      async () => new ResponseCtor('NF', { status: 404, statusText: 'Not Found' })
    ) as any;

    const api = getUserscript();
    await expect(api.download('https://example.com/missing.jpg', 'missing.jpg')).rejects.toThrow(
      /http_404/
    );
  });

  it('network error should reject and not create/revoke object URLs', async () => {
    globalThis.fetch = vi.fn(async () => Promise.reject(new TypeError('NetworkError'))) as any;
    const revokeSpy = vi.spyOn(globalThis.URL, 'revokeObjectURL');
    const createSpy = vi.spyOn(globalThis.URL, 'createObjectURL');

    const api = getUserscript();
    await expect(api.download('https://example.com/file.bin', 'file.bin')).rejects.toThrow(
      /NetworkError/
    );
    expect(createSpy).not.toHaveBeenCalled();
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it('DOM missing (no document.body) should be a no-op and resolve without calling fetch', async () => {
    // Simulate environment where document exists but lacks a usable body (undefined)
    const doc = globalThis.document as any;
    const originalBody = doc.body;
    Object.defineProperty(doc, 'body', { configurable: true, get: () => undefined });
    const fetchSpy = vi.spyOn(globalThis as any, 'fetch');

    const api = getUserscript();
    await expect(api.download('https://example.com/ok.bin', 'ok.bin')).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();

    // restore body to avoid side effects to other tests
    Object.defineProperty(doc, 'body', { configurable: true, get: () => originalBody });
  });
});
