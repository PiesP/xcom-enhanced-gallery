// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { downloadLiveByteBudget } from '@shared/services/download/live-byte-budget';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchOwnedArrayBufferWithRetry = vi.hoisted(() => vi.fn());

vi.mock('@shared/network/retry-fetch', () => ({ fetchOwnedArrayBufferWithRetry }));

import { downloadAsZip as assembleZip } from '@shared/services/download/zip-download';
import type { DownloadOptions, OrchestratorItem, ZipResult } from '@shared/services/download/types';
const results: ZipResult[] = [];
async function downloadAsZip(items: readonly OrchestratorItem[], options: DownloadOptions = {}): Promise<ZipResult> {
 const result = await assembleZip(items,options);
 results.push(result);
 return result;
}
afterEach(() => {for(const result of results.splice(0)) result.dispose();});

describe('downloadAsZip response bounds', () => {
  beforeEach(() => {
    fetchOwnedArrayBufferWithRetry.mockReset();
    fetchOwnedArrayBufferWithRetry.mockImplementation(async (_url, _retry, _signal, _backoff, cap, budget) => ({value: new Uint8Array(Math.min(3,cap)), lease: budget.reserve(Math.min(3,cap))}));
  });

  it('passes the per-entry byte budget to the network boundary', async () => {
    fetchOwnedArrayBufferWithRetry.mockResolvedValue({value: new Uint8Array([1,2,3]),lease: downloadLiveByteBudget.reserve(3)});

    await expect(
      downloadAsZip(
        [
          {
            url: 'https://pbs.twimg.com/media/valid.jpg',
            desiredName: 'valid.jpg',
          },
        ],
        { retries: 2, maxBufferedBytes: 8, maxEntryBytes: 5 }
      )
    ).resolves.toMatchObject({ filesSuccessful: 1, resourceLimitExceeded: false });

    expect(fetchOwnedArrayBufferWithRetry).toHaveBeenCalledWith(
      'https://pbs.twimg.com/media/valid.jpg',
      2,
      undefined,
      expect.any(Number),
      5,
      downloadLiveByteBudget
    );
  });

  it('returns a structured resource-limit result for an oversized network response', async () => {
    fetchOwnedArrayBufferWithRetry.mockRejectedValue(new HttpResponseSizeLimitError(5, 6));

    await expect(
      downloadAsZip(
        [
          {
            url: 'https://pbs.twimg.com/media/oversized.jpg',
            desiredName: 'oversized.jpg',
          },
        ],
        { maxBufferedBytes: 5, maxEntryBytes: 5 }
      )
    ).resolves.toMatchObject({
      filesSuccessful: 0,
      resourceLimitExceeded: true,
      failures: [{ error: expect.stringContaining('limit') }],
    });
  });

  it('reduces the next network limit to exact remaining stored-archive capacity', async () => {
    fetchOwnedArrayBufferWithRetry
      .mockResolvedValueOnce({value: new Uint8Array(4),lease: downloadLiveByteBudget.reserve(4)})
      .mockResolvedValueOnce({value: new Uint8Array(2),lease: downloadLiveByteBudget.reserve(2)});

    const result = await downloadAsZip(
      [
        { url: 'https://pbs.twimg.com/media/first.jpg', desiredName: 'a' },
        { url: 'https://pbs.twimg.com/media/second.jpg', desiredName: 'b' },
      ],
      {
        concurrency: 2,
        maxBufferedBytes: 4,
        maxEntryBytes: 4,
        // EOCD 22 + two stored entries (local 30 + central 46 + 2*filename 1) + data 4 + 2.
        maxArchiveBytes: 22 + 78 + 4 + 78 + 2,
      }
    );

    expect(result).toMatchObject({ filesSuccessful: 2, resourceLimitExceeded: false });
    expect(fetchOwnedArrayBufferWithRetry.mock.calls.map((call) => call[4])).toEqual([4, 2]);
  });

  it('does not fetch another unknown response when entry overhead exhausts the archive', async () => {
    fetchOwnedArrayBufferWithRetry.mockResolvedValue({value: new Uint8Array(4),lease: downloadLiveByteBudget.reserve(4)});
    const getBlob = vi.fn(async () => ({value: new Blob([new Uint8Array(1)]),lease: downloadLiveByteBudget.reserve(1)}));

    const result = await downloadAsZip(
      [
        { url: 'https://pbs.twimg.com/media/first.jpg', desiredName: 'a' },
        { url: 'https://pbs.twimg.com/media/second.jpg', desiredName: 'b', getBlob },
      ],
      {
        concurrency: 2,
        maxBufferedBytes: 4,
        maxEntryBytes: 4,
        // Exactly one stored entry: EOCD 22 + local/central/name overhead 78 + data 4.
        maxArchiveBytes: 22 + 78 + 4,
      }
    );

    expect(fetchOwnedArrayBufferWithRetry).toHaveBeenCalledOnce();
    expect(getBlob).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      filesSuccessful: 1,
      resourceLimitExceeded: true,
      failures: [{ url: 'https://pbs.twimg.com/media/second.jpg' }],
    });
  });

  it('passes reduced remaining capacity to a lazy Blob provider before it fetches', async () => {
    fetchOwnedArrayBufferWithRetry.mockResolvedValueOnce({value: new Uint8Array(4),lease: downloadLiveByteBudget.reserve(4)});
    const getBlob = vi.fn(async () => ({value: new Blob([new Uint8Array(2)]),lease: downloadLiveByteBudget.reserve(2)}));

    const result = await downloadAsZip(
      [
        { url: 'https://pbs.twimg.com/media/first.jpg', desiredName: 'a' },
        { url: 'https://pbs.twimg.com/media/cached.jpg', desiredName: 'b', getBlob },
      ],
      {
        concurrency: 2,
        maxBufferedBytes: 4,
        maxEntryBytes: 4,
        maxArchiveBytes: 22 + 78 + 4 + 78 + 2,
      }
    );

    expect(result).toMatchObject({ filesSuccessful: 2, resourceLimitExceeded: false });
    expect(getBlob).toHaveBeenCalledWith(undefined, 2);
  });
});
