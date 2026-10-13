import {
  DownloadResourceLimitError,
  downloadLiveByteBudget,
  LiveByteBudget,
  type OwnedBlob,
} from '@shared/services/download/live-byte-budget';
import type { DownloadOptions, OrchestratorItem, ZipResult } from '@shared/services/download/types';
import { downloadAsZip as assembleZip } from '@shared/services/download/zip-download';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface FixtureRequest {
  onload?: (response: { status: number; response: ArrayBuffer }) => void;
  onerror?: (response: { status: number }) => void;
}
let httpFixture: ((details: FixtureRequest) => { abort: () => void }) | undefined;
const dispatchFixture = (details: FixtureRequest) => {
  if (!httpFixture) throw new Error('No ZIP HTTP fixture installed');
  return httpFixture(details);
};
// The production userscript API captures the manager function once per page.
// Keep that function stable while each case owns its actual transport result.
function setHttpFixture(implementation: NonNullable<typeof httpFixture>): void {
  httpFixture = implementation;
  vi.stubGlobal('GM_xmlhttpRequest', dispatchFixture);
}
const results: ZipResult[] = [];
async function downloadAsZip(
  items: readonly OrchestratorItem[],
  options: DownloadOptions = {}
): Promise<ZipResult> {
  const result = await assembleZip(items, options);
  results.push(result);
  return result;
}
afterEach(() => {
  for (const result of results.splice(0)) result.dispose();
});

interface DeferredBlob {
  readonly promise: Promise<Blob>;
  readonly reject: (reason: unknown) => void;
  readonly resolve: (blob: Blob) => void;
}

function deferredBlob(): DeferredBlob {
  let resolve!: DeferredBlob['resolve'];
  let reject!: DeferredBlob['reject'];
  const promise = new Promise<Blob>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, reject, resolve };
}

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob): OwnedBlob {
  const owner = { value, lease: downloadLiveByteBudget.reserve(value.size) };
  inputOwners.push(owner);
  return owner;
}
afterEach(() => {
  for (const owner of inputOwners.splice(0)) owner.lease.release();
});

describe('user-facing bulk ZIP download', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('archives all selected media, keeps duplicate names unique, and reports completion', async () => {
    const progress: Array<{ phase: string; current: number; total: number; percentage: number }> =
      [];
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/one.jpg',
          desiredName: 'photo.jpg',
          blob: ownedBlob(new Blob(['one'])),
        },
        {
          url: 'https://pbs.twimg.com/media/two.jpg',
          desiredName: 'photo.jpg',
          blob: ownedBlob(new Blob(['two'])),
        },
      ],
      { onProgress: (entry) => progress.push(entry) }
    );

    expect(result.filesSuccessful).toBe(2);
    expect(result.failures).toEqual([]);
    expect(progress.at(-1)).toMatchObject({
      phase: 'complete',
      current: 2,
      total: 2,
      percentage: 100,
    });

    const archiveText = new TextDecoder().decode(
      await new Blob(result.zipData, { type: 'application/zip' }).arrayBuffer()
    );
    expect(archiveText).toContain('photo.jpg');
    expect(archiveText).toContain('photo-1.jpg');
  });

  it('admits a known direct response under a tiny live budget while an unused provider needs more copy capacity', async () => {
    const directUsage: number[] = [];
    const directBudget = new LiveByteBudget(1100, (bytes) => directUsage.push(bytes));
    const requests = vi.fn(
      (details: { onload?: (response: { status: number; response: ArrayBuffer }) => void }) => {
        details.onload?.({ status: 200, response: new ArrayBuffer(160) });
        return { abort: vi.fn() };
      }
    );
    setHttpFixture(requests);
    const directAdmissions: Array<{
      inputKind: string;
      maxResponseBytes: number;
      knownSize?: number;
    }> = [];
    const direct = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/direct.jpg',
          desiredName: 'a',
          inputKind: 'blob-provider',
          expectedSizeBytes: 160,
        },
      ],
      {
        retries: 0,
        liveBudget: directBudget,
        maxBufferedBytes: 200,
        onEntryAdmission: (entry) => directAdmissions.push(entry),
      }
    );

    expect(direct).toMatchObject({ filesSuccessful: 1, failures: [] });
    expect(directAdmissions).toEqual([
      {
        index: 0,
        inputKind: 'direct-url',
        maxResponseBytes: 176,
        knownSize: 160,
      },
    ]);
    expect(requests).toHaveBeenCalledTimes(1);
    expect(Math.max(...directUsage)).toBeLessThanOrEqual(1100);
    direct.dispose();
    expect(directBudget.usedBytes).toBe(0);

    const providerUsage: number[] = [];
    const providerBudget = new LiveByteBudget(1100, (bytes) => providerUsage.push(bytes));
    const provider = vi.fn(async () => null);
    const providerAdmissions: unknown[] = [];
    const deferred = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/provider.jpg',
          desiredName: 'a',
          inputKind: 'direct-url',
          expectedSizeBytes: 160,
          getBlob: provider,
        },
      ],
      {
        retries: 0,
        liveBudget: providerBudget,
        maxBufferedBytes: 200,
        onEntryAdmission: (entry) => providerAdmissions.push(entry),
      }
    );

    expect(deferred).toMatchObject({ filesSuccessful: 0, resourceLimitExceeded: true });
    expect(deferred.failures).toHaveLength(1);
    expect(providerAdmissions).toEqual([]);
    expect(provider).not.toHaveBeenCalled();
    expect(requests).toHaveBeenCalledTimes(1);
    expect(Math.max(...providerUsage)).toBeLessThanOrEqual(1100);
    deferred.dispose();
    expect(providerBudget.usedBytes).toBe(0);
  });

  it('uses URL fallback only after a resolved provider miss', async () => {
    const request = vi.fn(
      (details: { onload?: (response: { status: number; response: ArrayBuffer }) => void }) => {
        details.onload?.({ status: 200, response: new Uint8Array([1, 2, 3]).buffer });
        return { abort: vi.fn() };
      }
    );
    setHttpFixture(request);
    const getBlob = vi.fn(async () => null);

    const result = await downloadAsZip(
      [{ url: 'https://pbs.twimg.com/media/miss.jpg', desiredName: 'miss.jpg', getBlob }],
      { retries: 0 }
    );

    expect(result).toMatchObject({ filesSuccessful: 1, failures: [] });
    expect(getBlob).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['forbidden', Object.assign(new Error('HTTP:403'), { status: 403 })],
    ['rate-limited', Object.assign(new Error('HTTP:429'), { status: 429 })],
    ['resource limit', new DownloadResourceLimitError()],
    ['unknown', new Error('provider failed')],
  ])('does not refetch the URL when a provider rejects: %s', async (_label, error) => {
    const request = vi.fn();
    setHttpFixture(request);
    const getBlob = vi.fn(async () => {
      throw error;
    });
    const result = await downloadAsZip(
      [{ url: 'https://pbs.twimg.com/media/rejected.jpg', desiredName: 'rejected.jpg', getBlob }],
      { retries: 0 }
    );

    expect(result.filesSuccessful).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(getBlob).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
  });

  it('accepts a pending owned Blob without invoking a provider or URL request', async () => {
    const owner = ownedBlob(new Blob(['pending']));
    const getBlob = vi.fn(async () => owner);
    const request = vi.fn();
    setHttpFixture(request);

    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/pending.jpg',
          desiredName: 'pending.jpg',
          blob: Promise.resolve(owner),
          getBlob,
        },
      ],
      { retries: 0 }
    );

    expect(result).toMatchObject({ filesSuccessful: 1, failures: [] });
    expect(getBlob).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });

  it('returns partial results when one media item cannot be fetched', async () => {
    setHttpFixture(
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
          blob: ownedBlob(new Blob(['cached'])),
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

  it('propagates cancellation from a cooperative CRC32 yield', async () => {
    const controller = new AbortController();
    vi.stubGlobal('scheduler', {
      yield: vi.fn(async () => {
        controller.abort();
      }),
    });

    await expect(
      downloadAsZip(
        [
          {
            url: 'https://pbs.twimg.com/media/large.jpg',
            desiredName: 'large.jpg',
            blob: ownedBlob(new Blob([new Uint8Array(2 * 1024 * 1024)])),
          },
        ],
        { signal: controller.signal }
      )
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('serializes unknown-size Blob providers so their whole responses cannot overlap', async () => {
    const deferred = Array.from({ length: 8 }, () => deferredBlob());
    let active = 0;
    let maxActive = 0;
    let started = 0;
    const items = deferred.map((entry, index) => ({
      url: `https://pbs.twimg.com/media/lazy-${index}.jpg`,
      desiredName: `lazy-${index}.jpg`,
      getBlob: async () => {
        started++;
        active++;
        maxActive = Math.max(maxActive, active);
        try {
          const value = await entry.promise;
          return { value, lease: downloadLiveByteBudget.reserve(value.size) };
        } finally {
          active--;
        }
      },
    }));

    const resultPromise = downloadAsZip(items, { concurrency: 3 });
    await vi.waitFor(() => expect(started).toBe(1));

    for (let index = 0; index < deferred.length; index++) {
      deferred[index]?.resolve(new Blob([`image-${index}`]));
      if (index < deferred.length - 1) {
        await vi.waitFor(() => expect(started).toBe(index + 2));
      }
    }

    await expect(resultPromise).resolves.toMatchObject({ filesSuccessful: 8, failures: [] });
    expect(maxActive).toBe(1);
  });

  it('keeps retained whole-file buffers within the configured byte budget', async () => {
    const bufferedBytes: number[] = [];
    const items = Array.from({ length: 4 }, (_, index) => ({
      url: `https://pbs.twimg.com/media/bounded-${index}.jpg`,
      desiredName: `bounded-${index}.jpg`,
      blob: ownedBlob(new Blob([new Uint8Array(2 * 1024 * 1024)])),
    }));

    const result = await downloadAsZip(items, {
      concurrency: 4,
      maxBufferedBytes: 3 * 1024 * 1024,
      onBufferUsage: (bytes) => bufferedBytes.push(bytes),
    });

    expect(result.filesSuccessful).toBe(4);
    expect(Math.max(...bufferedBytes)).toBe(2 * 1024 * 1024);
    expect(bufferedBytes.at(-1)).toBe(0);
  });

  it('returns a structured resource-limit failure before buffering an oversized item', async () => {
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/oversized.jpg',
          desiredName: 'oversized.jpg',
          blob: ownedBlob(new Blob([new Uint8Array(6)])),
        },
      ],
      { maxBufferedBytes: 5, maxEntryBytes: 5 }
    );

    expect(result).toMatchObject({
      filesSuccessful: 0,
      resourceLimitExceeded: true,
      failures: [
        {
          url: 'https://pbs.twimg.com/media/oversized.jpg',
          error: expect.stringContaining('Bulk ZIP limit'),
        },
      ],
    });
  });

  it('stops adding entries when the retained archive reaches its byte limit', async () => {
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/archive-one.jpg',
          desiredName: 'archive-one.jpg',
          blob: ownedBlob(new Blob([new Uint8Array(3)])),
        },
        {
          url: 'https://pbs.twimg.com/media/archive-two.jpg',
          desiredName: 'archive-two.jpg',
          blob: ownedBlob(new Blob([new Uint8Array(3)])),
        },
      ],
      {
        concurrency: 1,
        // EOCD 22 + stored-entry overhead for "archive-one.jpg" (106) + 3 data bytes.
        maxArchiveBytes: 131,
      }
    );

    expect(result).toMatchObject({
      filesSuccessful: 1,
      resourceLimitExceeded: true,
      failures: [
        {
          url: 'https://pbs.twimg.com/media/archive-two.jpg',
          error: expect.stringContaining('archive capacity'),
        },
      ],
    });
  });

  it('aborts active lazy Blob providers without starting queued items', async () => {
    const controller = new AbortController();
    const started: number[] = [];
    const request = vi.fn();
    setHttpFixture(request);
    const items = Array.from({ length: 8 }, (_, index) => ({
      url: `https://pbs.twimg.com/media/cancel-${index}.jpg`,
      desiredName: `cancel-${index}.jpg`,
      getBlob: (signal?: AbortSignal) =>
        new Promise<OwnedBlob>((_resolve, reject) => {
          started.push(index);
          signal?.addEventListener(
            'abort',
            () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError')),
            { once: true }
          );
        }),
    }));

    const resultPromise = downloadAsZip(items, { concurrency: 3, signal: controller.signal });
    await vi.waitFor(() => expect(started).toHaveLength(1));
    controller.abort();

    await expect(resultPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(started).toEqual([0]);
    expect(request).not.toHaveBeenCalled();
  });
});
