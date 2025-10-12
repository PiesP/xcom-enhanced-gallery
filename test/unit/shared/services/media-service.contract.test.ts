/**
 * @fileoverview Phase E: MediaService 공개 계약(Interface-like) 가드 테스트
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mediaService } from '../../../../src/shared/services/media-service';
import * as accessors from '../../../../src/shared/container/service-accessors';

const PUBLIC_METHODS = [
  'extractFromClickedElement',
  'extractAllFromContainer',
  'extractWithFallback',
  'pauseAllBackgroundVideos',
  'restoreBackgroundVideos',
  'isVideoControlActive',
  'getPausedVideoCount',
  'forceResetVideoControl',
  'prefetchNextMedia',
  'cancelAllPrefetch',
  'clearPrefetchCache',
  'getPrefetchMetrics',
  'downloadSingle',
  'downloadMultiple',
  'downloadBulk',
  'cleanup',
];

describe('Phase E: MediaService 계약(Contract) 가드', () => {
  it('필수 공개 메서드를 모두 제공해야 한다', () => {
    for (const key of PUBLIC_METHODS) {
      expect(typeof (mediaService as any)[key]).toBe('function');
    }
  });

  it('prefetchNextMedia는 Promise<void>를 반환하고 prefetchRange 0에서도 에러가 없어야 한다', async () => {
    await expect(
      mediaService.prefetchNextMedia(['https://example.com/a.jpg'], 0, { prefetchRange: 0 })
    ).resolves.toBeUndefined();
  });
});

describe('Phase E: Download Result 계약', () => {
  const originalFetch = (globalThis as any).fetch;
  let restoreAccessor: (() => void) | null = null;

  beforeEach(() => {
    // 실패를 유도하여 실패 결과의 계약(shape)을 검증
    (globalThis as any).fetch = vi.fn(async () => {
      throw new Error('Network down');
    }) as unknown as any;

    // MediaService가 BulkDownloadService로 위임하므로, 테스트 격리용 fake 주입
    const fake = {
      downloadMultiple: vi.fn(async (items: any[]) => ({
        success: false,
        status: 'error',
        filesProcessed: Array.isArray(items) ? items.length : 0,
        filesSuccessful: 0,
        error: 'Network down',
      })),
      downloadSingle: vi.fn(async (_item: any) => ({
        success: false,
        status: 'error',
        error: 'Network down',
      })),
    };
    const spy = vi
      .spyOn(accessors, 'getBulkDownloadServiceFromContainer')
      .mockImplementation(() => fake as any);
    restoreAccessor = () => spy.mockRestore();
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
    if (restoreAccessor) {
      restoreAccessor();
      restoreAccessor = null;
    }
  });

  it('downloadMultiple는 실패 시 { success: false, error, filesProcessed }를 반환한다', async () => {
    const items = [{ url: 'https://example.com/a.jpg', filename: 'a.jpg', type: 'image' }] as any[];

    const result = await mediaService.downloadMultiple(items, {} as any);

    expect(result).toHaveProperty('success');
    expect(result.success).toBe(false);
    expect(result).toHaveProperty('filesProcessed');
    expect(typeof result.filesProcessed).toBe('number');
    expect(result).toHaveProperty('error');
  });
});
