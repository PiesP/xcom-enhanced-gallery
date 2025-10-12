import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mediaService } from '../../../../src/shared/services/media-service';
import * as accessors from '../../../../src/shared/container/service-accessors';

// Create a simple fake BulkDownloadService
class FakeBulkDownloadService {
  downloadSingle = vi.fn(async (_media: any) => ({
    success: true,
    status: 'success',
    filename: 'a.jpg',
  }));
  downloadMultiple = vi.fn(async (_items: any[], _opts: any) => ({
    success: true,
    status: 'success',
    filesProcessed: Array.isArray(_items) ? _items.length : 0,
    filesSuccessful: Array.isArray(_items) ? _items.length : 0,
    filename: 'z.zip',
  }));
}

describe('MediaService → BulkDownloadService delegation', () => {
  const original = { ...accessors } as any;
  let fake: FakeBulkDownloadService;

  beforeEach(() => {
    fake = new FakeBulkDownloadService();
    vi.spyOn(accessors, 'getBulkDownloadServiceFromContainer').mockImplementation(
      () => fake as any
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloadSingle delegates to BulkDownloadService.downloadSingle', async () => {
    const res = await mediaService.downloadSingle({
      url: 'u',
      type: 'image',
      filename: 'a.jpg',
    } as any);
    expect(fake.downloadSingle).toHaveBeenCalledTimes(1);
    expect(res.success).toBe(true);
  });

  it('downloadMultiple delegates to BulkDownloadService.downloadMultiple and passes through options', async () => {
    const items = [
      { url: 'u1', type: 'image', filename: 'a.jpg' },
      { url: 'u2', type: 'image', filename: 'b.jpg' },
    ] as any[];
    const onProgress = vi.fn();
    const res = await mediaService.downloadMultiple(items, {
      onProgress,
      zipFilename: 'x.zip',
    } as any);
    expect(fake.downloadMultiple).toHaveBeenCalledTimes(1);
    const call = (fake.downloadMultiple as any).mock.calls[0];
    expect(call[0]).toEqual(items);
    expect(call[1]).toMatchObject({ onProgress, zipFilename: 'x.zip' });
    expect(res.success).toBe(true);
    expect(res.filesProcessed).toBe(2);
  });
});
