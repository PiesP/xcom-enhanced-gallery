// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchArrayBufferWithRetry = vi.hoisted(() => vi.fn());

vi.mock('@shared/network/retry-fetch', () => ({ fetchArrayBufferWithRetry }));

import { downloadAsZip } from '@shared/services/download/zip-download';

describe('downloadAsZip response bounds', () => {
  beforeEach(() => {
    fetchArrayBufferWithRetry.mockReset();
  });

  it('passes the per-entry byte budget to the network boundary', async () => {
    fetchArrayBufferWithRetry.mockResolvedValue(new Uint8Array([1, 2, 3]));

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

    expect(fetchArrayBufferWithRetry).toHaveBeenCalledWith(
      'https://pbs.twimg.com/media/valid.jpg',
      2,
      undefined,
      expect.any(Number),
      5
    );
  });

  it('returns a structured resource-limit result for an oversized network response', async () => {
    fetchArrayBufferWithRetry.mockRejectedValue(new HttpResponseSizeLimitError(5, 6));

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
    fetchArrayBufferWithRetry
      .mockResolvedValueOnce(new Uint8Array(4))
      .mockResolvedValueOnce(new Uint8Array(2));

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
    expect(fetchArrayBufferWithRetry.mock.calls.map((call) => call[4])).toEqual([4, 2]);
  });

  it('does not fetch another unknown response when entry overhead exhausts the archive', async () => {
    fetchArrayBufferWithRetry.mockResolvedValue(new Uint8Array(4));
    const getBlob = vi.fn(async () => new Blob([new Uint8Array(1)]));

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

    expect(fetchArrayBufferWithRetry).toHaveBeenCalledOnce();
    expect(getBlob).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      filesSuccessful: 1,
      resourceLimitExceeded: true,
      failures: [{ url: 'https://pbs.twimg.com/media/second.jpg' }],
    });
  });

  it('passes reduced remaining capacity to a lazy Blob provider before it fetches', async () => {
    fetchArrayBufferWithRetry.mockResolvedValueOnce(new Uint8Array(4));
    const getBlob = vi.fn(async () => new Blob([new Uint8Array(2)]));

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
