// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { fetchOwnedArrayBufferWithRetry } from '@shared/network/retry-fetch';
import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';
import {
  DownloadResourceLimitError,
  LiveByteBudget,
} from '@shared/services/download/live-byte-budget';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  calls: 0,
  lastOptions: null as unknown,
  impl: null as null | ((options: unknown) => Promise<unknown>),
}));
vi.mock('@shared/services/http-request-service', () => ({
  getHttpRequestService: () => ({
    getOwnedBinary: (_url: string, options: unknown): Promise<unknown> => {
      client.calls++;
      client.lastOptions = options;
      if (!client.impl) throw new Error('Missing HTTP fixture');
      return client.impl(options);
    },
  }),
}));

describe('owned arraybuffer retry', () => {
  beforeEach(() => {
    client.calls = 0;
    client.lastOptions = null;
    client.impl = null;
  });

  it('releases a failed status response before retrying and preserves the successful owner', async () => {
    const budget = new LiveByteBudget(12);
    client.impl = async () => {
      if (client.calls === 1) {
        return {
          ok: false,
          status: 503,
          data: new ArrayBuffer(2),
          lease: budget.reserve(2),
        };
      }
      expect(budget.usedBytes).toBe(0);
      return {
        ok: true,
        status: 200,
        data: new Uint8Array([1, 2]).buffer,
        lease: budget.reserve(2),
      };
    };
    const owned = await fetchOwnedArrayBufferWithRetry(
      'https://pbs.twimg.com/media/test',
      1,
      undefined,
      0,
      4,
      budget
    );
    expect(owned.value).toEqual(new Uint8Array([1, 2]));
    expect(client.calls).toBe(2);
    expect(budget.usedBytes).toBe(2);
    owned.lease.release();
    expect(budget.usedBytes).toBe(0);
  });

  it('does not retry a live budget exhaustion', async () => {
    const error = new DownloadResourceLimitError();
    client.impl = () => new Promise((_, reject) => setTimeout(() => reject(error), 0));
    let observed: unknown;
    try {
      await fetchOwnedArrayBufferWithRetry('https://pbs.twimg.com/media/test', 3, undefined, 0, 4);
    } catch (caught) {
      observed = caught;
    }
    expect((observed as Error).name).toBe('DownloadResourceLimitError');
    expect(client.calls).toBe(1);
  });

  it('does not retry a response-size limit', async () => {
    const error = new HttpResponseSizeLimitError(4, 5);
    client.impl = () => new Promise((_, reject) => setTimeout(() => reject(error), 0));
    let observed: unknown;
    try {
      await fetchOwnedArrayBufferWithRetry('https://pbs.twimg.com/media/oversized.jpg', 3, undefined, 0, 4);
    } catch (caught) {
      observed = caught;
    }
    expect(observed).toBe(error);
    expect(client.calls).toBe(1);
  });

  it('passes the response byte cap to HTTP and returns a releasable binary owner', async () => {
    const budget = new LiveByteBudget(16);
    client.impl = async () => ({
      ok: true,
      status: 200,
      data: new Uint8Array([1, 2, 3]).buffer,
      lease: budget.reserve(3),
    });
    const owned = await fetchOwnedArrayBufferWithRetry(
      'https://pbs.twimg.com/media/valid.jpg',
      3,
      undefined,
      0,
      4,
      budget
    );
    expect(client.lastOptions).toEqual(expect.objectContaining({ maxResponseBytes: 4, budget }));
    expect(owned.value).toEqual(new Uint8Array([1, 2, 3]));
    expect(budget.usedBytes).toBe(3);
    owned.lease.release();
    expect(budget.usedBytes).toBe(0);
  });
});
