// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { planBulkDownload } from '@shared/core/download/download-plan';
import { LiveByteBudget, type OwnedBlob } from '@shared/services/download/live-byte-budget';
import { downloadAsZip } from '@shared/services/download/zip-download';
import type { MediaInfo } from '@shared/types/media.types';
import { describe, expect, it } from 'vite-plus/test';
import { verifyStoredZip } from '../../../../../validation/windows/download-memory.ts';

function gate(): { promise: Promise<void>; release: () => void } {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

class ControlledBlob extends Blob {
  constructor(
    bytes: string,
    private readonly started: ReturnType<typeof gate>,
    private readonly copy: ReturnType<typeof gate>
  ) {
    super([bytes]);
  }

  override async arrayBuffer(): Promise<ArrayBuffer> {
    this.started.release();
    await this.copy.promise;
    return super.arrayBuffer();
  }
}

describe('ZIP order contract for concurrent owned Blobs', () => {
  it('keeps input-assigned names and bytes while physical entries follow reverse completion', async () => {
    const budget = new LiveByteBudget(8192);
    const firstStarted = gate();
    const secondStarted = gate();
    const firstCopy = gate();
    const secondCopy = gate();
    const secondCommitted = gate();
    const firstBlob = new ControlledBlob('first bytes', firstStarted, firstCopy);
    const secondBlob = new ControlledBlob('second bytes', secondStarted, secondCopy);
    const owners: OwnedBlob[] = [firstBlob, secondBlob].map((value) => ({
      value,
      lease: budget.reserve(value.size),
    }));
    const media: MediaInfo[] = [
      {
        id: 'first',
        type: 'image',
        url: 'https://pbs.twimg.com/media/first.jpg',
        tweetUsername: 'alice',
        tweetId: '111',
        attachmentOrdinal: 0,
      },
      {
        id: 'second',
        type: 'image',
        url: 'https://pbs.twimg.com/media/second.jpg',
        tweetUsername: 'alice',
        tweetId: '111',
        attachmentOrdinal: 1,
      },
    ];
    const plan = planBulkDownload({
      mediaItems: media,
      cachedBlobs: new Map([
        [media[0]!.url, owners[0]!],
        [media[1]!.url, owners[1]!],
      ]),
    });
    expect(plan.zipFilename).toBe('alice_111.zip');
    expect(plan.items.map(({ url, desiredName }) => [url, desiredName])).toEqual([
      ['https://pbs.twimg.com/media/first.jpg', 'alice_111_0.jpg'],
      ['https://pbs.twimg.com/media/second.jpg', 'alice_111_1.jpg'],
    ]);

    const controller = new AbortController();
    const admissions: number[] = [];
    let result: Awaited<ReturnType<typeof downloadAsZip>> | undefined;
    let archive: OwnedBlob | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_resolve, reject) => {
      deadline = setTimeout(() => reject(new Error('Concurrent ZIP reads did not settle')), 5000);
    });
    const pending = downloadAsZip(plan.items, {
      liveBudget: budget,
      concurrency: 2,
      signal: controller.signal,
      onEntryAdmission: ({ index }) => admissions.push(index),
      onProgress: ({ phase, filename }) => {
        if (phase === 'downloading' && filename === 'alice_111_1.jpg') {
          secondCommitted.release();
        }
      },
    });

    try {
      await Promise.race([Promise.all([firstStarted.promise, secondStarted.promise]), timedOut]);
      expect(admissions).toEqual([0, 1]);
      secondCopy.release();
      await Promise.race([secondCommitted.promise, timedOut]);
      firstCopy.release();
      result = await Promise.race([pending, timedOut]);
      expect(result).toMatchObject({ filesSuccessful: 2, failures: [] });
      archive = result.createBlob();
      const parsed = verifyStoredZip(Buffer.from(await archive.value.arrayBuffer()), [
        { filename: 'alice_111_1.jpg', bytes: Buffer.from('second bytes') },
        { filename: 'alice_111_0.jpg', bytes: Buffer.from('first bytes') },
      ]);
      expect(parsed.entryOrder).toEqual(['alice_111_1.jpg', 'alice_111_0.jpg']);
    } catch (error) {
      controller.abort();
      throw error;
    } finally {
      firstCopy.release();
      secondCopy.release();
      result ??= await pending.catch(() => undefined);
      archive?.lease.release();
      result?.dispose();
      for (const owner of owners) {
        owner.lease.release();
      }
      if (deadline) {
        clearTimeout(deadline);
      }
    }
    expect(budget.usedBytes).toBe(0);
  }, 10_000);
});
