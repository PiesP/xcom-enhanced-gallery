import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { mediaService } from '@/shared/services/media-service';

// Phase 323-4: Mock UnifiedDownloadService directly
const mockDownloadSingle = vi.fn(async (_media: any) => ({
  success: true,
  filename: 'a.jpg',
}));

const mockDownloadBulk = vi.fn(async (_items: any[]) => ({
  success: true,
  status: 'success',
  filesProcessed: Array.isArray(_items) ? _items.length : 0,
  filesSuccessful: Array.isArray(_items) ? _items.length : 0,
  filename: 'z.zip',
}));

describe('MediaService → UnifiedDownloadService delegation', () => {
  setupGlobalTestIsolation();

  beforeEach(async () => {
    mockDownloadSingle.mockClear();
    mockDownloadBulk.mockClear();

    vi.doMock('@/shared/services/unified-download-service', () => ({
      unifiedDownloadService: {
        downloadSingle: mockDownloadSingle,
        downloadBulk: mockDownloadBulk,
      },
    }));
  });

  afterEach(() => {
    vi.doUnmock('@/shared/services/unified-download-service');
  });

  it('downloadSingle delegates to UnifiedDownloadService.downloadSingle', async () => {
    const res = await mediaService.downloadSingle({
      url: 'u',
      type: 'image',
      filename: 'a.jpg',
    } as any);
    expect(mockDownloadSingle).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
  });

  it('downloadMultiple delegates to UnifiedDownloadService.downloadBulk and passes through options', async () => {
    const items = [
      { url: 'u1', type: 'image', filename: 'a.jpg' },
      { url: 'u2', type: 'image', filename: 'b.jpg' },
    ] as any[];

    const res = await mediaService.downloadMultiple(items, {} as any);
    expect(mockDownloadBulk).toHaveBeenCalledTimes(1);
    const call = mockDownloadBulk.mock.calls[0];
    expect(call[0]).toEqual(items);
    expect(res.success).toBe(true);
    expect(res.filesProcessed).toBe(2);
  });
});
