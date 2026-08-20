// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';

const httpGet = vi.hoisted(() => vi.fn());

vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({ get: httpGet }),
}));

import { fetchArrayBufferWithRetry } from '@shared/network/retry-fetch';

describe('fetchArrayBufferWithRetry resource limits', () => {
  beforeEach(() => {
    httpGet.mockReset();
  });

  it('does not retry a response-size resource limit', async () => {
    const error = new HttpResponseSizeLimitError(4, 5);
    httpGet.mockRejectedValue(error);

    await expect(
      fetchArrayBufferWithRetry(
        'https://pbs.twimg.com/media/oversized.jpg',
        3,
        undefined,
        0,
        4
      )
    ).rejects.toBe(error);

    expect(httpGet).toHaveBeenCalledOnce();
  });

  it('passes the caller byte limit through on a valid response', async () => {
    httpGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: new Uint8Array([1, 2, 3]).buffer,
    });

    await expect(
      fetchArrayBufferWithRetry(
        'https://pbs.twimg.com/media/valid.jpg',
        3,
        undefined,
        0,
        4
      )
    ).resolves.toEqual(new Uint8Array([1, 2, 3]));

    expect(httpGet).toHaveBeenCalledWith(
      'https://pbs.twimg.com/media/valid.jpg',
      expect.objectContaining({ maxResponseBytes: 4 })
    );
  });
});
