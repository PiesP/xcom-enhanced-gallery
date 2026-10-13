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

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { downloadLiveByteBudget, type OwnedBlob } from '@shared/services/download/live-byte-budget';

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob): OwnedBlob {
  const owner = { value, lease: downloadLiveByteBudget.reserve(value.size) };
  inputOwners.push(owner);
  return owner;
}
afterEach(() => {
  for (const owner of inputOwners.splice(0)) owner.lease.release();
});

describe('DownloadOrchestrator bulk resource limits', () => {
  beforeEach(() => {
    state.downloadBlob
      .mockReset()
      .mockImplementation(async (_blob, _filename, _signal, released) => {
        released?.();
      });
  });

  it('does not invoke a provider, fetch a substitute, or save a ZIP for unverified original photos', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const provider = vi.fn();
    const fetch = vi.spyOn(globalThis, 'fetch');
    const result = await orchestrator.downloadBulk(
      [
        {
          id: '222_dom_0',
          type: 'image',
          url: 'https://pbs.twimg.com/media/photo.jpg?name=small&name=large',
          downloadSource: { url: '', quality: 'unverified-original', provenance: 'dom' },
        },
      ],
      { mediaBlobProvider: provider }
    );
    expect(result).toMatchObject({
      success: false,
      code: 'SOURCE_UNAVAILABLE',
      filesSuccessful: 0,
      filesProcessed: 1,
    });
    expect(provider).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(state.downloadBlob).not.toHaveBeenCalled();
    expect(downloadLiveByteBudget.usedBytes).toBe(0);
    fetch.mockRestore();
    orchestrator.destroy();
  });

  it('saves verified ZIP entries and reports excluded unverified originals as a partial result', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const safeUrl = 'https://pbs.twimg.com/media/verified.jpg?name=orig';
    const result = await orchestrator.downloadBulk(
      [
        {
          id: '222_dom_0',
          type: 'image',
          url: 'https://pbs.twimg.com/media/photo.jpg?name=small&name=large',
          downloadSource: { url: '', quality: 'unverified-original', provenance: 'dom' },
        },
        {
          id: '222_dom_1',
          type: 'image',
          url: safeUrl,
          downloadSource: { url: safeUrl, quality: 'cdn-original', provenance: 'dom' },
        },
      ],
      { cachedBlobs: new Map([[safeUrl, ownedBlob(new Blob(['verified original bytes']))]]) }
    );
    expect(result).toMatchObject({
      success: true,
      status: 'partial',
      code: 'SOURCE_UNAVAILABLE',
      filesSuccessful: 1,
      filesProcessed: 2,
    });
    expect(result.failures).toHaveLength(1);
    expect(state.downloadBlob).toHaveBeenCalledOnce();
    orchestrator.destroy();
  });

  it.each([false, true])(
    'retains unverified originals alongside resource rejection, with successful entry=%s',
    async (includeSuccess) => {
      const orchestrator = new DownloadOrchestrator();
      orchestrator.initialize();
      const safeUrl = 'https://pbs.twimg.com/media/verified.jpg?name=orig';
      const unverified = {
        id: '222_dom_0',
        type: 'image' as const,
        url: 'https://pbs.twimg.com/media/photo.jpg?name=small&name=large',
        downloadSource: {
          url: '' as const,
          quality: 'unverified-original' as const,
          provenance: 'dom' as const,
        },
      };
      const oversized = {
        id: '222_dom_1',
        type: 'image' as const,
        url: 'https://pbs.twimg.com/media/oversized.jpg?name=orig',
        fileSize: 6,
      };
      const accepted = { id: '222_dom_2', type: 'image' as const, url: safeUrl };
      const result = await orchestrator.downloadBulk(
        [unverified, oversized, ...(includeSuccess ? [accepted] : [])],
        { maxEntryBytes: 5, cachedBlobs: new Map([[safeUrl, ownedBlob(new Blob(['safe']))]]) }
      );
      expect(result).toMatchObject({
        success: includeSuccess,
        status: includeSuccess ? 'partial' : 'error',
        code: 'RESOURCE_LIMIT',
        sourceUnavailable: true,
        filesSuccessful: includeSuccess ? 1 : 0,
        filesProcessed: includeSuccess ? 3 : 2,
      });
      expect(result.failures).toHaveLength(2);
      expect(result.failures).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ error: expect.stringContaining('original image') }),
          expect.objectContaining({ error: expect.stringContaining('limit') }),
        ])
      );
      expect(state.downloadBlob).toHaveBeenCalledTimes(includeSuccess ? 1 : 0);
      orchestrator.destroy();
    }
  );

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
