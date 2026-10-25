import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

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
import { HttpRequestError } from '@shared/services/http-request-service';
import {
  downloadLiveByteBudget,
  LiveByteBudget,
  type OwnedBlob,
} from '@shared/services/download/live-byte-budget';
import type { MediaInfo } from '@shared/types/media.types';
import { verifyStoredZip } from '../../../../../validation/windows/download-memory.ts';

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob, budget = downloadLiveByteBudget): OwnedBlob {
  const owner = { value, lease: budget.reserve(value.size) };
  inputOwners.push(owner);
  return owner;
}
afterEach(() => {
  for (const owner of inputOwners.splice(0)) {
    owner.lease.release();
  }
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

  it('makes a failed-only ZIP with the original assigned name and no success refetch', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const media: MediaInfo[] = ['first', 'missing', 'last'].map((id) => ({
      id,
      type: 'image',
      url: `https://pbs.twimg.com/media/${id}.jpg?name=orig`,
      filename: 'same.jpg',
    }));
    const saved: Array<{ filename: string; bytes: Buffer }> = [];
    state.downloadBlob.mockImplementation(
      async (blob: Blob, filename: string, _signal, released) => {
        saved.push({ filename, bytes: Buffer.from(await blob.arrayBuffer()) });
        released?.();
      }
    );
    const provider = Object.assign(
      vi
        .fn()
        .mockRejectedValueOnce(new HttpRequestError(503, true, 'http'))
        .mockImplementationOnce(async () => ownedBlob(new Blob(['recovered']))),
      { supports: (item: MediaInfo) => item.id === 'missing' }
    );
    const cachedBlobs = new Map([
      [media[0]!.url, ownedBlob(new Blob(['first']))],
      [media[2]!.url, ownedBlob(new Blob(['last']))],
    ]);
    const first = await orchestrator.downloadBulk(media, {
      zipFilename: 'gallery.zip',
      cachedBlobs,
      mediaBlobProvider: provider,
      retries: 0,
    });
    expect(first).toMatchObject({ success: true, status: 'partial', filesSuccessful: 2 });
    expect(first.failedEntries).toEqual([
      {
        index: 1,
        url: media[1]!.url,
        filename: 'same-1.jpg',
        error: 'HTTP:503',
      },
    ]);
    expect(
      verifyStoredZip(saved[0]!.bytes, [
        { filename: 'same.jpg', bytes: Buffer.from('first') },
        { filename: 'same-2.jpg', bytes: Buffer.from('last') },
      ]).entryOrder
    ).toEqual(['same.jpg', 'same-2.jpg']);

    const recovered = await orchestrator.downloadFailedEntries(
      [{ index: 1, media: media[1]!, url: media[1]!.url, filename: 'same-1.jpg' }],
      first.filename!,
      1,
      { mediaBlobProvider: provider, retries: 0 }
    );
    expect(recovered).toMatchObject({
      success: true,
      status: 'success',
      filename: 'gallery-missing.zip',
      filesSuccessful: 1,
    });
    expect(saved[1]!.filename).toBe('gallery-missing.zip');
    expect(
      verifyStoredZip(saved[1]!.bytes, [
        { filename: 'same-1.jpg', bytes: Buffer.from('recovered') },
      ]).entryOrder
    ).toEqual(['same-1.jpg']);
    expect(provider).toHaveBeenCalledTimes(2);
    expect(state.downloadBlob).toHaveBeenCalledTimes(2);
    provider.mockImplementationOnce(async () => ownedBlob(new Blob(['recovered again'])));
    const repeated = await orchestrator.downloadFailedEntries(
      [{ index: 1, media: media[1]!, url: media[1]!.url, filename: 'same-1.jpg' }],
      first.filename!,
      2,
      { mediaBlobProvider: provider, retries: 0 }
    );
    expect(repeated.filename).toBe('gallery-missing-2.zip');
    expect(
      verifyStoredZip(saved[2]!.bytes, [
        { filename: 'same-1.jpg', bytes: Buffer.from('recovered again') },
      ]).entryOrder
    ).toEqual(['same-1.jpg']);
    orchestrator.destroy();
  });

  it('does not recover a changed or unverified source identity', async () => {
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    const media: MediaInfo = {
      id: 'missing',
      type: 'image',
      url: 'https://pbs.twimg.com/media/missing.jpg?name=small',
      downloadSource: {
        url: '',
        quality: 'unverified-original',
        provenance: 'dom',
      },
    };
    const provider = vi.fn();
    const result = await orchestrator.downloadFailedEntries(
      [{ index: 0, media, url: media.url, filename: 'missing.jpg' }],
      'gallery.zip',
      1,
      { mediaBlobProvider: provider }
    );
    expect(result).toMatchObject({ success: false, code: 'EMPTY_INPUT' });
    expect(provider).not.toHaveBeenCalled();
    expect(state.downloadBlob).not.toHaveBeenCalled();
    orchestrator.destroy();
  });

  it.each([403, 404])(
    'reports HTTP %i rejection of a verified original separately from source verification',
    async (status) => {
      const orchestrator = new DownloadOrchestrator();
      orchestrator.initialize();
      const deniedUrl = 'https://pbs.twimg.com/media/denied.jpg?name=orig';
      const acceptedUrl = 'https://pbs.twimg.com/media/accepted.jpg?name=orig';
      const denied = {
        id: 'denied',
        type: 'image' as const,
        url: deniedUrl,
        downloadSource: {
          url: deniedUrl,
          quality: 'cdn-original' as const,
          provenance: 'dom' as const,
        },
      };
      const accepted = {
        id: 'accepted',
        type: 'image' as const,
        url: acceptedUrl,
        downloadSource: {
          url: acceptedUrl,
          quality: 'cdn-original' as const,
          provenance: 'dom' as const,
        },
      };
      const provider = Object.assign(
        vi.fn(async () => {
          throw new HttpRequestError(status, true, 'http');
        }),
        { supports: (media: MediaInfo) => media.id === denied.id }
      );
      const result = await orchestrator.downloadBulk([denied, accepted], {
        mediaBlobProvider: provider,
        cachedBlobs: new Map([[acceptedUrl, ownedBlob(new Blob(['ok']))]]),
      });

      expect(result).toMatchObject({
        success: true,
        status: 'partial',
        code: 'NONE',
        filesSuccessful: 1,
        sourceFetchStatuses: [status],
      });
      expect(result.sourceUnavailable).toBeUndefined();
      expect(result.failures).toEqual([{ url: deniedUrl, error: `HTTP:${status}` }]);
      orchestrator.destroy();
    }
  );

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
      const denied = {
        id: 'denied',
        type: 'image' as const,
        url: 'https://pbs.twimg.com/media/denied.jpg?name=orig',
        fileSize: 4,
      };
      const deniedProvider = Object.assign(
        vi.fn(async () => {
          throw new Error('HTTP 403');
        }),
        { supports: (media: MediaInfo) => media.id === denied.id }
      );
      const accepted = {
        id: '222_dom_2',
        type: 'image' as const,
        url: safeUrl,
        filename: 'verified.jpg',
      };
      const result = await orchestrator.downloadBulk(
        [unverified, oversized, denied, ...(includeSuccess ? [accepted] : [])],
        {
          maxEntryBytes: 5,
          cachedBlobs: new Map([[safeUrl, ownedBlob(new Blob(['safe']))]]),
          mediaBlobProvider: deniedProvider,
        }
      );
      expect(result).toMatchObject({
        success: includeSuccess,
        status: includeSuccess ? 'partial' : 'error',
        code: 'RESOURCE_LIMIT',
        sourceUnavailable: true,
        filesSuccessful: includeSuccess ? 1 : 0,
        filesProcessed: includeSuccess ? 4 : 3,
      });
      expect(result.failures).toHaveLength(3);
      expect(result.failures).toEqual(
        expect.arrayContaining([
          { url: '', error: expect.stringContaining('original image') },
          { url: oversized.url, error: expect.stringContaining('limit') },
          { url: denied.url, error: expect.stringContaining('HTTP 403') },
        ])
      );
      expect(deniedProvider).toHaveBeenCalledOnce();
      if (includeSuccess) {
        expect(state.downloadBlob).toHaveBeenCalledOnce();
        const saved = state.downloadBlob.mock.calls[0]?.[0];
        if (!(saved instanceof Blob)) {
          throw new Error('Partial ZIP was not passed to the native adapter');
        }
        const archive = verifyStoredZip(Buffer.from(await saved.arrayBuffer()), [
          { filename: accepted.filename, bytes: Buffer.from('safe') },
        ]);
        expect(archive.entryOrder).toEqual([accepted.filename]);
      } else {
        expect(state.downloadBlob).not.toHaveBeenCalled();
      }
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

  it('keeps a handed-off ZIP charged across orchestrators until its native owner releases it', async () => {
    const budget = new LiveByteBudget(700);
    const url = 'https://pbs.twimg.com/media/a.jpg';
    const media: MediaInfo = { id: '1', type: 'image', url, filename: 'a.jpg' };
    const first = new DownloadOrchestrator();
    first.initialize();
    const firstInput = ownedBlob(new Blob(['a']), budget);
    let releaseNative: (() => void) | undefined;
    let heldZipSize = 0;
    state.downloadBlob.mockImplementationOnce((blob, _filename, signal, released) => {
      heldZipSize = blob.size;
      releaseNative = released;
      return new Promise<void>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
          once: true,
        });
      });
    });

    const pending = first.downloadBulk([media], {
      liveBudget: budget,
      cachedBlobs: new Map([[url, firstInput]]),
      maxBufferedBytes: 16,
      maxEntryBytes: 16,
    });
    await vi.waitFor(() => expect(releaseNative).toBeTypeOf('function'));
    firstInput.lease.release();
    first.destroy();
    expect(await pending).toMatchObject({ success: false, code: 'CANCELLED' });
    expect(budget.usedBytes).toBe(heldZipSize);

    const second = new DownloadOrchestrator();
    second.initialize();
    const blockedInput = ownedBlob(new Blob(['b']), budget);
    const blockedAdmissions: number[] = [];
    const blocked = await second.downloadBulk([media], {
      liveBudget: budget,
      cachedBlobs: new Map([[url, blockedInput]]),
      maxBufferedBytes: 16,
      maxEntryBytes: 16,
      onEntryAdmission: ({ index }) => blockedAdmissions.push(index),
    });
    blockedInput.lease.release();
    expect(blocked).toMatchObject({ success: false, code: 'RESOURCE_LIMIT' });
    expect(blockedAdmissions).toEqual([]);
    expect(state.downloadBlob).toHaveBeenCalledOnce();
    expect(budget.usedBytes).toBe(heldZipSize);

    releaseNative?.();
    expect(budget.usedBytes).toBe(0);
    const freshInput = ownedBlob(new Blob(['c']), budget);
    const fresh = await second.downloadBulk([media], {
      liveBudget: budget,
      cachedBlobs: new Map([[url, freshInput]]),
      maxBufferedBytes: 16,
      maxEntryBytes: 16,
    });
    freshInput.lease.release();
    expect(fresh).toMatchObject({ success: true, filesSuccessful: 1 });
    expect(state.downloadBlob).toHaveBeenCalledTimes(2);
    expect(budget.usedBytes).toBe(0);
    second.destroy();
  });

  it('waits for a cancelled ZIP Blob copy to settle before draining and admitting fresh work', async () => {
    const budget = new LiveByteBudget(8192);
    const firstUrl = 'https://pbs.twimg.com/media/first.jpg';
    const queuedUrl = 'https://pbs.twimg.com/media/queued.jpg';
    const first: MediaInfo = { id: 'first', type: 'image', url: firstUrl, filename: 'a.jpg' };
    const queued: MediaInfo = { id: 'queued', type: 'image', url: queuedUrl, filename: 'b.jpg' };
    let finishCopy: ((bytes: ArrayBuffer) => void) | undefined;
    class PendingBlob extends Blob {
      override arrayBuffer(): Promise<ArrayBuffer> {
        return new Promise((resolve) => {
          finishCopy = resolve;
        });
      }
    }
    const firstInput = ownedBlob(new PendingBlob(['held']), budget);
    const queuedInput = ownedBlob(new Blob(['queued']), budget);
    const admitted: number[] = [];
    const progress: string[] = [];
    const orchestrator = new DownloadOrchestrator();
    orchestrator.initialize();
    let settled = false;
    const pending = orchestrator.downloadBulk([first, queued], {
      liveBudget: budget,
      cachedBlobs: new Map([
        [firstUrl, firstInput],
        [queuedUrl, queuedInput],
      ]),
      concurrency: 1,
      onEntryAdmission: ({ index }) => admitted.push(index),
      onProgress: ({ phase }) => progress.push(phase),
    });
    const observed = pending.finally(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(finishCopy).toBeTypeOf('function'));
    orchestrator.destroy();
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(budget.usedBytes).toBeGreaterThan(firstInput.lease.bytes + queuedInput.lease.bytes);
    expect(admitted).toEqual([0]);
    expect(state.downloadBlob).not.toHaveBeenCalled();

    finishCopy?.(new Uint8Array([1, 2, 3, 4]).buffer);
    expect(await observed).toMatchObject({ success: false, code: 'CANCELLED' });
    expect(settled).toBe(true);
    firstInput.lease.release();
    queuedInput.lease.release();
    expect(admitted).toEqual([0]);
    expect(progress).not.toContain('complete');
    expect(state.downloadBlob).not.toHaveBeenCalled();
    expect(budget.usedBytes).toBe(0);

    orchestrator.initialize();
    const freshInput = ownedBlob(new Blob(['fresh']), budget);
    const fresh = await orchestrator.downloadBulk([first], {
      liveBudget: budget,
      cachedBlobs: new Map([[firstUrl, freshInput]]),
    });
    freshInput.lease.release();
    expect(fresh).toMatchObject({ success: true, filesSuccessful: 1 });
    expect(state.downloadBlob).toHaveBeenCalledOnce();
    expect(budget.usedBytes).toBe(0);
    orchestrator.destroy();
  });
});
