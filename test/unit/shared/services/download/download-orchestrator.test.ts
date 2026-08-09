import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  downloadBlob: vi.fn(),
}));

vi.mock('@platform/index', () => ({
  getDownloadAdapter: () => ({
    download: vi.fn(),
    downloadBlob: state.downloadBlob,
    needsBlobFallback: () => false,
  }),
}));

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';

describe('DownloadOrchestrator bulk resource limits', () => {
  beforeEach(() => {
    state.downloadBlob.mockReset().mockResolvedValue(undefined);
  });

  it('returns a dedicated error code when every selected item exceeds the ZIP memory limit', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();

    const result = await orchestrator.downloadBulk(
      [
        {
          id: 'oversized',
          url: 'https://pbs.twimg.com/media/oversized.jpg',
          type: 'image',
          fileSize: 6,
        },
      ],
      { maxBufferedBytes: 5, maxEntryBytes: 5 }
    );

    expect(result).toMatchObject({
      success: false,
      code: 'RESOURCE_LIMIT',
      error: expect.stringContaining('individually'),
      filesSuccessful: 0,
    });
    expect(state.downloadBlob).not.toHaveBeenCalled();
  });

  it('preserves the resource limit code when a partial ZIP is saved', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const safeUrl = 'https://pbs.twimg.com/media/safe.jpg';

    const result = await orchestrator.downloadBulk(
      [
        { id: 'safe', url: safeUrl, type: 'image', fileSize: 4 },
        {
          id: 'oversized',
          url: 'https://pbs.twimg.com/media/oversized.jpg',
          type: 'image',
          fileSize: 6,
        },
      ],
      {
        cachedBlobs: new Map([[safeUrl, new Blob(['safe'])]]),
        maxBufferedBytes: 5,
        maxEntryBytes: 5,
      }
    );

    expect(result).toMatchObject({
      success: true,
      status: 'partial',
      code: 'RESOURCE_LIMIT',
      filesProcessed: 2,
      filesSuccessful: 1,
    });
    expect(state.downloadBlob).toHaveBeenCalledOnce();
  });
});
