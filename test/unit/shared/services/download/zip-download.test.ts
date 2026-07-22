import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadAsZip } from '@shared/services/download/zip-download';

describe('user-facing bulk ZIP download', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('archives all selected media, keeps duplicate names unique, and reports completion', async () => {
    const progress: Array<{ phase: string; current: number; total: number; percentage: number }> = [];
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/one.jpg',
          desiredName: 'photo.jpg',
          blob: new Blob(['one']),
        },
        {
          url: 'https://pbs.twimg.com/media/two.jpg',
          desiredName: 'photo.jpg',
          blob: new Blob(['two']),
        },
      ],
      { onProgress: (entry) => progress.push(entry) }
    );

    expect(result.filesSuccessful).toBe(2);
    expect(result.failures).toEqual([]);
    expect(progress.at(-1)).toMatchObject({ phase: 'complete', current: 2, total: 2, percentage: 100 });

    const archiveText = new TextDecoder().decode(
      await new Blob(result.zipData, { type: 'application/zip' }).arrayBuffer()
    );
    expect(archiveText).toContain('photo.jpg');
    expect(archiveText).toContain('photo-1.jpg');
  });

  it('returns partial results when one media item cannot be fetched', async () => {
    vi.stubGlobal(
      'GM_xmlhttpRequest',
      vi.fn((details: { onerror?: (response: { status: number }) => void }) => {
        details.onerror?.({ status: 0 });
        return { abort: vi.fn() };
      })
    );

    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/available.jpg',
          desiredName: 'available.jpg',
          blob: new Blob(['cached']),
        },
        {
          url: 'https://pbs.twimg.com/media/missing.jpg',
          desiredName: 'missing.jpg',
        },
      ],
      { retries: 0 }
    );

    expect(result.filesSuccessful).toBe(1);
    expect(result.failures).toEqual([
      { url: 'https://pbs.twimg.com/media/missing.jpg', error: 'NET' },
    ]);
  });
});
