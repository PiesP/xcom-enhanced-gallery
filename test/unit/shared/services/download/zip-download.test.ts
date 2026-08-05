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

  it('starts lazy Blob providers only within the configured worker concurrency', async () => {
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
    await vi.waitFor(() => expect(started).toBe(3));

    for (let index = 0; index < deferred.length; index++) {
      deferred[index]?.resolve(new Blob([`image-${index}`]));
      if (index < deferred.length - 3) {
        await vi.waitFor(() => expect(started).toBe(index + 4));
      }
    }

    await expect(resultPromise).resolves.toMatchObject({ filesSuccessful: 8, failures: [] });
    expect(maxActive).toBe(3);
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
    await vi.waitFor(() => expect(started).toHaveLength(3));
    controller.abort();

    await expect(resultPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(started).toEqual([0, 1, 2]);
  });
});
