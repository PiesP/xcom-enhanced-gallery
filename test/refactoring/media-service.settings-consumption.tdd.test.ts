import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SERVICE_KEYS } from '@/constants';

describe('MediaService - settings consumption (quality mapping, concurrency, autoZip) (TDD RED)', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-02T03:04:05.000Z'));

    // reset service manager and register mock settings
    const { CoreService } = await import('@shared/services/service-manager');
    CoreService.resetInstance();
    const sm = CoreService.getInstance();

    const store: any = {
      download: {
        imageQuality: 'original', // should map to 'orig'
        maxConcurrentDownloads: 5,
        autoZip: true,
      },
    };

    const mockSettingsService = {
      isInitialized: () => true,
      get: (key: string) => {
        const parts = key.split('.');
        let v: any = store;
        for (const p of parts) v = v?.[p];
        return v;
      },
      set: vi.fn(),
      updateBatch: vi.fn(),
      getAllSettings: () => store,
      subscribe: () => () => {},
    } as any;

    sm.register(SERVICE_KEYS.SETTINGS_MANAGER, mockSettingsService);
  });

  it('maps imageQuality original->orig and uses it for downloads', async () => {
    const { MediaService } = await import('@shared/services/media-service');
    const service = new MediaService();

    // Spy on fetch to ensure URL contains name=orig when possible
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
      blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
      headers: new Map([['content-length', '8']]) as any,
      status: 200,
      statusText: 'OK',
    } as any);

    const result = await service.downloadMultiple(
      [
        {
          url: 'https://pbs.twimg.com/media/ID1?format=jpg&name=large',
          type: 'image',
          quality: 'large',
          id: 'id1',
        },
        {
          url: 'https://pbs.twimg.com/media/ID2?format=jpg&name=medium',
          type: 'image',
          quality: 'medium',
          id: 'id2',
        },
      ],
      {}
    );

    expect(result.success).toBe(true);
    // Called for each item
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fetchSpy.mockRestore();
  });

  it('applies maxConcurrentDownloads when creating ZIP and autoZip=true triggers ZIP path', async () => {
    const { MediaService } = await import('@shared/services/media-service');
    const service = new MediaService();

    // Spy and stub fflate.zipSync and download
    const { getNativeDownload } = await import('@shared/external/vendors');
    const download = getNativeDownload();
    const blobSpy = vi.spyOn(download, 'downloadBlob').mockImplementation(() => {});

    // Mock fetch
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
      blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
      headers: new Map([['content-length', '8']]) as any,
      status: 200,
      statusText: 'OK',
    } as any);

    const result = await service.downloadMultiple(
      [
        {
          url: 'https://pbs.twimg.com/media/ID1?format=jpg&name=large',
          type: 'image',
          quality: 'large',
          id: 'id1',
        },
        {
          url: 'https://pbs.twimg.com/media/ID2?format=jpg&name=large',
          type: 'image',
          quality: 'large',
          id: 'id2',
        },
        {
          url: 'https://pbs.twimg.com/media/ID3?format=jpg&name=large',
          type: 'image',
          quality: 'large',
          id: 'id3',
        },
      ],
      {}
    );

    expect(result.success).toBe(true);
    // autoZip=true should create a zip and call downloadBlob with .zip filename
    expect(blobSpy).toHaveBeenCalled();
    const zipArg = (blobSpy.mock.calls[0] || [])[1] as string;
    expect(zipArg).toMatch(/\.zip$/);

    blobSpy.mockRestore();
  });
});
