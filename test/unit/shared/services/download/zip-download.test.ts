import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadAsZip } from '@shared/services/download/zip-download';

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
            blob: new Blob([new Uint8Array(2 * 1024 * 1024)]),
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
          return await entry.promise;
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
      blob: new Blob([new Uint8Array(2 * 1024 * 1024)]),
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
          blob: new Blob([new Uint8Array(6)]),
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
          blob: new Blob([new Uint8Array(3)]),
        },
        {
          url: 'https://pbs.twimg.com/media/archive-two.jpg',
          desiredName: 'archive-two.jpg',
          blob: new Blob([new Uint8Array(3)]),
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
    const items = Array.from({ length: 8 }, (_, index) => ({
      url: `https://pbs.twimg.com/media/cancel-${index}.jpg`,
      desiredName: `cancel-${index}.jpg`,
      getBlob: (signal?: AbortSignal) =>
        new Promise<Blob>((_resolve, reject) => {
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
  });
});
