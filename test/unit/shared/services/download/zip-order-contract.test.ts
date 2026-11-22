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
    let primaryFailure: unknown;
    let hasPrimaryFailure = false;
    const cleanupFailures: unknown[] = [];
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
      hasPrimaryFailure = true;
      primaryFailure = error;
    } finally {
      firstCopy.release();
      secondCopy.release();
      if (!result) {
        let cleanupDeadline: ReturnType<typeof setTimeout> | undefined;
        try {
          const settled = await Promise.race([
            pending.then(
              (value) => ({ kind: 'fulfilled' as const, value }),
              () => ({ kind: 'rejected' as const })
            ),
            new Promise<{ kind: 'timeout' }>((resolve) => {
              cleanupDeadline = setTimeout(() => resolve({ kind: 'timeout' }), 1000);
            }),
          ]);
          if (settled.kind === 'fulfilled') {
            result = settled.value;
          } else if (settled.kind === 'timeout') {
            cleanupFailures.push(new Error('Cancelled ZIP cleanup did not settle within 1 second'));
            // The test has already failed; still release any ZIP ownership that arrives later.
            void pending.then((lateResult) => lateResult.dispose()).catch(() => undefined);
          }
        } catch (error) {
          cleanupFailures.push(error);
        } finally {
          if (cleanupDeadline) {
            clearTimeout(cleanupDeadline);
          }
        }
      }
      const safely = (release: () => void): void => {
        try {
          release();
        } catch (error) {
          cleanupFailures.push(error);
        }
      };
      const ownedArchive = archive;
      if (ownedArchive) {
        safely(() => ownedArchive.lease.release());
      }
      const settledResult = result;
      if (settledResult) {
        safely(() => settledResult.dispose());
      }
      for (const owner of owners) {
        safely(() => owner.lease.release());
      }
      if (deadline) {
        clearTimeout(deadline);
      }
    }
    if (hasPrimaryFailure || cleanupFailures.length > 0) {
      const failures = hasPrimaryFailure ? [primaryFailure, ...cleanupFailures] : cleanupFailures;
      if (failures.length === 1) {
        throw failures[0];
      }
      throw new AggregateError(failures, 'ZIP order fixture and cleanup failed');
    }
    expect(budget.usedBytes).toBe(0);
  }, 10_000);
});
