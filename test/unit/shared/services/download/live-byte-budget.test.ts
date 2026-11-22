// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { BorrowedZipBlob } from '@shared/external/zip/streaming-zip-writer';
import {
  DownloadResourceLimitError,
  LiveByteBudget,
  type OwnedBlob,
  reserveBinaryResponse,
} from '@shared/services/download/live-byte-budget';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { verifyStoredZip } from '../../../../../validation/windows/download-memory.ts';

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob, budget: LiveByteBudget): OwnedBlob {
  const owner = { value, lease: budget.reserve(value.size) };
  inputOwners.push(owner);
  return owner;
}
afterEach(() => {
  for (const owner of inputOwners.splice(0)) {
    owner.lease.release();
  }
});

describe('shared download binary ownership', () => {
  it('returns the first EOCD reservation when its copy cannot be admitted', async () => {
    const budget = new LiveByteBudget(30);
    await expect(downloadAsZip([], { liveBudget: budget })).rejects.toBeInstanceOf(
      DownloadResourceLimitError
    );
    expect(budget.usedBytes).toBe(0);
    const later = budget.reserve(30);
    later.release();
  });
  it('charges shared backing storage until the last owner releases it', () => {
    const budget = new LiveByteBudget(12);
    const cache = budget.reserve(8);
    const download = cache.fork();
    cache.release();
    cache.release();
    expect(budget.usedBytes).toBe(8);
    expect(() => budget.reserve(5)).toThrow(DownloadResourceLimitError);
    download.release();
    expect(budget.usedBytes).toBe(0);
    const later = budget.reserve(12);
    later.release();
  });

  it('admits chunks and their output copy before starting a binary response', () => {
    const budget = new LiveByteBudget(20);
    const retained = budget.reserve(6);
    const response = reserveBinaryResponse(budget, 100);
    expect(response.maxBytes).toBe(7);
    expect(budget.usedBytes).toBe(20);
    response.lease.shrink(3);
    expect(budget.usedBytes).toBe(9);
    response.lease.release();
    retained.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('retains committed ZIP storage and reserved final-copy capacity through Blob handoff', async () => {
    const usages: number[] = [];
    const budget = new LiveByteBudget(8192, (bytes) => usages.push(bytes));
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/a.jpg',
          desiredName: 'a.jpg',
          blob: ownedBlob(new Blob(['first']), budget),
        },
        {
          url: 'https://pbs.twimg.com/media/b.jpg',
          desiredName: 'b.jpg',
          blob: ownedBlob(new Blob(['second']), budget),
        },
      ],
      { liveBudget: budget }
    );
    expect(result.filesSuccessful).toBe(2);
    for (const owner of inputOwners.splice(0)) {
      owner.lease.release();
    }
    const retained = budget.usedBytes;
    expect(retained).toBeGreaterThan(11);
    const owned = result.createBlob();
    expect(budget.usedBytes).toBe(owned.value.size);
    expect(budget.usedBytes).toBeLessThan(retained);
    expect(result.zipData).toHaveLength(0);
    result.dispose();
    expect(budget.usedBytes).toBe(owned.value.size);
    const bytes = new Uint8Array(await owned.value.arrayBuffer());
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder().decode(bytes)).toContain('second');
    owned.lease.release();
    expect(budget.usedBytes).toBe(0);
    expect(Math.max(...usages)).toBeLessThanOrEqual(budget.limitBytes);
  });

  it('retains the source Blob and bounds checksum scratch at near-limit admission', async () => {
    const chunk = 1024 * 1024;
    const size = 2 * chunk + 17;
    const filename = 'large.bin';
    const overhead = 2 * (22 + 256 + filename.length * 8);
    const limit = overhead + 2 * size + chunk;
    const usages: number[] = [];
    const budget = new LiveByteBudget(limit, (bytes) => usages.push(bytes));
    const source = new Blob([new Uint8Array(size)]);
    const input = ownedBlob(source, budget);
    const result = await downloadAsZip(
      [{ url: 'https://pbs.twimg.com/media/large.jpg', desiredName: filename, blob: input }],
      { liveBudget: budget }
    );
    expect(result.failures).toEqual([]);
    expect(result.zipData).toContain(source);
    expect(Math.max(...usages)).toBe(limit);
    input.lease.release();
    expect(budget.usedBytes).toBe(overhead + 2 * size);
    const output = result.createBlob();
    result.dispose();
    expect(budget.usedBytes).toBe(output.value.size);
    output.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it.each([1024 * 1024 - 1, 1024 * 1024, 1024 * 1024 + 1])(
    'retains the admitted representation and final-copy capacity at %i bytes',
    async (size) => {
      const chunk = 1024 * 1024;
      const filename = 'stripe.bin';
      const overhead = 2 * (22 + 256 + filename.length * 8);
      const peak = overhead + 2 * size + Math.min(size, chunk);
      const usages: number[] = [];
      const budget = new LiveByteBudget(peak, (used) => usages.push(used));
      const expected = Buffer.alloc(size, 0x57);
      const input = ownedBlob(new Blob([expected]), budget);
      const result = await downloadAsZip(
        [{ url: 'https://pbs.twimg.com/media/stripe.jpg', desiredName: filename, blob: input }],
        { liveBudget: budget }
      );
      expect(result.failures).toEqual([]);
      expect(Math.max(...usages)).toBe(peak);
      expect(result.zipData.includes(input.value)).toBe(size > chunk);
      expect(
        result.zipData.some((part) => ArrayBuffer.isView(part) && part.byteLength === size)
      ).toBe(size <= chunk);
      expect(budget.usedBytes).toBe(overhead + (size <= chunk ? 3 : 2) * size);
      input.lease.release();
      expect(budget.usedBytes).toBe(overhead + 2 * size);
      const saved = result.createBlob();
      expect(budget.usedBytes).toBe(saved.value.size);
      verifyStoredZip(Buffer.from(await saved.value.arrayBuffer()), [
        { filename, bytes: expected },
      ]);
      result.dispose();
      saved.lease.release();
      expect(budget.usedBytes).toBe(0);
    }
  );

  it('retains a one-range read until it settles after cancellation', async () => {
    const filename = 'a.jpg';
    const source = new Blob(['abc']);
    const expectedPeak = 2 * (22 + 256 + filename.length * 8) + 3 * source.size;
    const budget = new LiveByteBudget(expectedPeak);
    const input = ownedBlob(source, budget);
    const started = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const original = BorrowedZipBlob.prototype.read;
    const pendingRead = vi
      .spyOn(BorrowedZipBlob.prototype, 'read')
      .mockImplementationOnce(async function (this: BorrowedZipBlob, start, end) {
        started.resolve();
        await finish.promise;
        return original.call(this, start, end);
      });
    try {
      const controller = new AbortController();
      const pending = downloadAsZip(
        [{ url: 'https://pbs.twimg.com/media/a.jpg', desiredName: filename, blob: input }],
        { liveBudget: budget, signal: controller.signal }
      );
      const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      await started.promise;
      controller.abort();
      expect(budget.usedBytes).toBe(expectedPeak);
      finish.resolve();
      await rejected;
      expect(budget.usedBytes).toBe(source.size);
      input.lease.release();
      expect(budget.usedBytes).toBe(0);
    } finally {
      finish.resolve();
      pendingRead.mockRestore();
    }
  });

  it('checksums and saves the actual bytes returned by a custom Blob reader', async () => {
    class ProviderBlob extends Blob {
      override async arrayBuffer(): Promise<ArrayBuffer> {
        return new Uint8Array([7, 3]).buffer;
      }
    }
    const budget = new LiveByteBudget(8192);
    const input = ownedBlob(new ProviderBlob(['different native body']), budget);
    const shadowed = ownedBlob(new Blob(['abc']), budget);
    vi.spyOn(shadowed.value, 'arrayBuffer').mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    const result = await downloadAsZip(
      [
        { url: 'https://pbs.twimg.com/media/a.jpg', desiredName: 'a.jpg', blob: input },
        { url: 'https://pbs.twimg.com/media/b.jpg', desiredName: 'b.jpg', blob: shadowed },
      ],
      { liveBudget: budget }
    );
    expect(result.failures).toEqual([]);
    expect(result.zipData).not.toContain(input.value);
    expect(result.zipData).not.toContain(shadowed.value);
    const saved = result.createBlob();
    const bytes = Buffer.from(await saved.value.arrayBuffer());
    verifyStoredZip(bytes, [
      { filename: 'a.jpg', bytes: Buffer.from([7, 3]) },
      { filename: 'b.jpg', bytes: Buffer.from([1, 2, 3]) },
    ]);
    input.lease.release();
    shadowed.lease.release();
    saved.lease.release();
    result.dispose();
    expect(budget.usedBytes).toBe(0);
  });

  it('rejects custom reader output larger than admitted capacity', async () => {
    const budget = new LiveByteBudget(8192);
    const source = new Blob(['x']);
    const reader = vi.spyOn(source, 'arrayBuffer').mockResolvedValue(new Uint8Array(5).buffer);
    const input = ownedBlob(source, budget);
    const result = await downloadAsZip(
      [{ url: 'https://pbs.twimg.com/media/a.jpg', desiredName: 'a.jpg', blob: input }],
      { liveBudget: budget }
    );
    expect(reader).toHaveBeenCalledOnce();
    expect(result.resourceLimitExceeded).toBe(true);
    expect(result.filesSuccessful).toBe(0);
    result.dispose();
    input.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('declines a custom read when only a bounded CRC slice would fit', async () => {
    const chunk = 1024 * 1024;
    const size = 2 * chunk;
    const filename = 'large.bin';
    const budget = new LiveByteBudget(2 * (22 + 256 + filename.length * 8) + 2 * size + chunk);
    const input = ownedBlob(new Blob([new Uint8Array(size)]), budget);
    const read = vi.spyOn(input.value, 'arrayBuffer');
    const result = await downloadAsZip(
      [{ url: 'https://pbs.twimg.com/media/a.jpg', desiredName: filename, blob: input }],
      { liveBudget: budget }
    );
    expect(read).not.toHaveBeenCalled();
    expect(result.resourceLimitExceeded).toBe(true);
    expect(result.filesSuccessful).toBe(0);
    result.dispose();
    input.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('keeps an honest partial ZIP and permits a small later operation after disposal', async () => {
    const budget = new LiveByteBudget(2500);
    const result = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/a.jpg',
          desiredName: 'a',
          blob: ownedBlob(new Blob(['ok']), budget),
        },
        {
          url: 'https://pbs.twimg.com/media/b.jpg',
          desiredName: 'b',
          blob: ownedBlob(new Blob([new Uint8Array(1024)]), budget),
        },
      ],
      { liveBudget: budget, concurrency: 1 }
    );
    expect(result).toMatchObject({ filesSuccessful: 1, resourceLimitExceeded: true });
    expect(result.failures).toHaveLength(1);
    for (const owner of inputOwners.splice(0)) {
      owner.lease.release();
    }
    const owned = result.createBlob();
    expect(new TextDecoder().decode(await owned.value.arrayBuffer())).toContain('ok');
    owned.lease.release();
    result.dispose();
    expect(budget.usedBytes).toBe(0);
    const next = await downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/c.jpg',
          desiredName: 'c',
          blob: ownedBlob(new Blob(['next']), budget),
        },
      ],
      { liveBudget: budget }
    );
    expect(next.filesSuccessful).toBe(1);
    for (const owner of inputOwners.splice(0)) {
      owner.lease.release();
    }
    next.dispose();
    expect(budget.usedBytes).toBe(0);
  });

  it('allocates nothing for a request already cancelled before admission', async () => {
    const budget = new LiveByteBudget(1024);
    const controller = new AbortController();
    controller.abort();
    await expect(
      downloadAsZip([], { liveBudget: budget, signal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(budget.usedBytes).toBe(0);
  });

  it('waits for an admitted Blob copy to settle before returning cancelled writer capacity', async () => {
    const budget = new LiveByteBudget(8192);
    const controller = new AbortController();
    let finishCopy: ((bytes: ArrayBuffer) => void) | undefined;
    class PendingBlob extends Blob {
      override arrayBuffer(): Promise<ArrayBuffer> {
        return new Promise((resolve) => {
          finishCopy = resolve;
        });
      }
    }
    const pending = downloadAsZip(
      [
        {
          url: 'https://pbs.twimg.com/media/a.jpg',
          desiredName: 'a',
          blob: ownedBlob(new PendingBlob(['a']), budget),
        },
      ],
      { liveBudget: budget, signal: controller.signal }
    );
    const observed = pending.catch((error: unknown) => error);
    await vi.waitFor(() => expect(finishCopy).toBeTypeOf('function'));
    const admitted = budget.usedBytes;
    // The one-byte input alone survives cancellation. Detect premature return
    // of any writer or copy credit while the underlying Blob is still pending.
    expect(admitted).toBeGreaterThan(1);
    const deniedWhilePending = budget.limitBytes - admitted + 1;
    controller.abort();
    // Observe after all abort reactions have had a turn, with I/O still unresolved.
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(budget.usedBytes).toBe(admitted);
    expect(() => budget.reserve(deniedWhilePending)).toThrow(DownloadResourceLimitError);
    finishCopy?.(new ArrayBuffer(1));
    expect(await observed).toMatchObject({ name: 'AbortError' });
    expect(budget.usedBytes).toBe(1);
    for (const owner of inputOwners.splice(0)) {
      owner.lease.release();
    }
    expect(budget.usedBytes).toBe(0);
  });
});
