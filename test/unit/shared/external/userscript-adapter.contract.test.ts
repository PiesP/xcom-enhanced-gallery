import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

describe('Userscript Adapter – 경계 가드', () => {
  setupGlobalTestIsolation();

  const originalFetch = globalThis.fetch;
  const originalCreateObjectURL = globalThis.URL.createObjectURL;
  const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;
  const originalGMInfo = (globalThis as unknown as Record<string, unknown>).GM_info;
  const originalGMDownload = (globalThis as unknown as Record<string, unknown>).GM_download;

  beforeEach(() => {
    // reset GM_* - delete properties to ensure they're truly absent
    delete (globalThis as unknown as Record<string, unknown>).GM_download;
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
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it('GM_* 미존재 환경에서 안전한 기본 속성을 제공한다', async () => {
    // Dynamic import after GM_* reset
    const { getUserscript } = await import('@/shared/external/userscript/adapter');
    const api = getUserscript();
    expect(api.hasGM).toBe(false);
    expect(['unknown', 'tampermonkey', 'greasemonkey', 'violentmonkey']).toContain(api.manager);
    // info()는 환경에 따라 null 또는 객체를 반환할 수 있으므로 안전성만 검증한다
    const info = api.info();
    expect(info === null || typeof info === 'object').toBe(true);
    expect(typeof api.download).toBe('function');
  });

  it('download()는 GM_download 없으면 에러를 throw한다 (fallback 없음)', async () => {
    // Arrange: No GM_download, clean environment
    const { getUserscript } = await import('@/shared/external/userscript/adapter');
    const api = getUserscript();

    // Act & Assert: Should throw error when GM_download is not available
    await expect(api.download('https://example.com/foo.bin', 'foo.bin')).rejects.toThrow(
      'GM_download not available'
    );
  });

  it('GM_download가 존재하면 이를 사용한다', async () => {
    const gmDownloadMock = vi.fn(() => {
      // simulate GM_download success
    });
    // Phase 101: hasGMInfo() 타입 가드가 GM_info를 확인하므로 mock 추가
    (globalThis as unknown as Record<string, unknown>).GM_info = {
      script: { name: 'test', version: '1.0' },
    };
    (globalThis as unknown as Record<string, unknown>).GM_download = gmDownloadMock;

    const { getUserscript } = await import('@/shared/external/userscript/adapter');
    const api = getUserscript();
    await expect(api.download('https://example.com/img.jpg', 'img.jpg')).resolves.toBeUndefined();
    expect(gmDownloadMock).toHaveBeenCalledWith('https://example.com/img.jpg', 'img.jpg');
  });
});
