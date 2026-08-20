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
});
