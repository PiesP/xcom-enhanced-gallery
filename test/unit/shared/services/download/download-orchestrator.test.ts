import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { downloadLiveByteBudget, type OwnedBlob } from '@shared/services/download/live-byte-budget';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob): OwnedBlob {
  const owner = {value, lease: downloadLiveByteBudget.reserve(value.size)};
  inputOwners.push(owner);
  return owner;
}
afterEach(() => { for (const owner of inputOwners.splice(0)) owner.lease.release(); });

describe('DownloadOrchestrator bulk resource limits', () => {
  beforeEach(() => {
    state.downloadBlob.mockReset().mockImplementation(async (_blob, _filename, _signal, released) => {released?.();});
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
      error: expect.stringContaining('reload this page'),
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
        cachedBlobs: new Map([[safeUrl, ownedBlob(new Blob(['safe']))]]),
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
