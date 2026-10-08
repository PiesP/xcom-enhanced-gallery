// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DownloadResourceLimitError, LiveByteBudget, reserveBinaryResponse, type OwnedBlob } from '@shared/services/download/live-byte-budget';
import { downloadAsZip } from '@shared/services/download/zip-download';
import { afterEach, describe, expect, it, vi } from 'vitest';

const inputOwners: OwnedBlob[] = [];
function ownedBlob(value: Blob, budget: LiveByteBudget): OwnedBlob {
  const owner = {value, lease: budget.reserve(value.size)};
  inputOwners.push(owner);
  return owner;
}
afterEach(() => { for (const owner of inputOwners.splice(0)) owner.lease.release(); });

describe('shared download binary ownership', () => {
  it('returns the first EOCD reservation when its copy cannot be admitted', async () => {
    const budget = new LiveByteBudget(30);
    await expect(downloadAsZip([], {liveBudget:budget})).rejects.toBeInstanceOf(DownloadResourceLimitError);
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
    const result = await downloadAsZip([
      { url: 'https://pbs.twimg.com/media/a.jpg', desiredName: 'a.jpg', blob: ownedBlob(new Blob(['first']), budget) },
      { url: 'https://pbs.twimg.com/media/b.jpg', desiredName: 'b.jpg', blob: ownedBlob(new Blob(['second']), budget) },
    ], { liveBudget: budget });
    expect(result.filesSuccessful).toBe(2);
    for (const owner of inputOwners.splice(0)) owner.lease.release();
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

  it('keeps an honest partial ZIP and permits a small later operation after disposal', async () => {
    const budget = new LiveByteBudget(2500);
    const result = await downloadAsZip([
      { url: 'https://pbs.twimg.com/media/a.jpg', desiredName: 'a', blob: ownedBlob(new Blob(['ok']), budget) },
      { url: 'https://pbs.twimg.com/media/b.jpg', desiredName: 'b', blob: ownedBlob(new Blob([new Uint8Array(1024)]), budget) },
    ], { liveBudget: budget, concurrency: 1 });
    expect(result).toMatchObject({ filesSuccessful: 1, resourceLimitExceeded: true });
    expect(result.failures).toHaveLength(1);
    for (const owner of inputOwners.splice(0)) owner.lease.release();
    const owned = result.createBlob();
    expect(new TextDecoder().decode(await owned.value.arrayBuffer())).toContain('ok');
    owned.lease.release();
    result.dispose();
    expect(budget.usedBytes).toBe(0);
    const next = await downloadAsZip([
      { url: 'https://pbs.twimg.com/media/c.jpg', desiredName: 'c', blob: ownedBlob(new Blob(['next']), budget) },
    ], { liveBudget: budget });
    expect(next.filesSuccessful).toBe(1);
    for (const owner of inputOwners.splice(0)) owner.lease.release();
    next.dispose();
    expect(budget.usedBytes).toBe(0);
  });

  it('allocates nothing for a request already cancelled before admission', async () => {
    const budget = new LiveByteBudget(1024);
    const controller = new AbortController();
    controller.abort();
    await expect(downloadAsZip([], { liveBudget: budget, signal: controller.signal })).rejects.toMatchObject({name:'AbortError'});
    expect(budget.usedBytes).toBe(0);
  });

  it('waits for an admitted Blob copy to settle before returning cancelled writer capacity', async () => {
    const budget = new LiveByteBudget(8192);
    const controller = new AbortController();
    let finishCopy: ((bytes: ArrayBuffer) => void) | undefined;
    class PendingBlob extends Blob {
      override arrayBuffer(): Promise<ArrayBuffer> {
        return new Promise((resolve) => { finishCopy = resolve; });
      }
    }
    const pending = downloadAsZip([
      {url:'https://pbs.twimg.com/media/a.jpg',desiredName:'a',blob:ownedBlob(new PendingBlob(['a']), budget)},
    ], {liveBudget:budget,signal:controller.signal});
    const observed = pending.catch((error: unknown) => error);
    await vi.waitFor(() => expect(finishCopy).toBeTypeOf('function'));
    controller.abort();
    await Promise.resolve();
    expect(budget.usedBytes).toBeGreaterThan(0);
    finishCopy?.(new ArrayBuffer(1));
    expect(await observed).toMatchObject({name:'AbortError'});
    for (const owner of inputOwners.splice(0)) owner.lease.release();
    expect(budget.usedBytes).toBe(0);
  });
});
