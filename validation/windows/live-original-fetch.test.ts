// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { describe, expect, it } from 'vitest';
import { fetchBoundedLiveOriginal } from './live-original-fetch.ts';

const source = 'https://pbs.twimg.com/media/HWYmWugaUAAi_4m?format=jpg&name=orig';

function responseFor(stream: ReadableStream<Uint8Array>, length: number): Response {
  const response = new Response(stream, {
    status: 200,
    headers: { 'content-length': String(length), 'content-type': 'image/jpeg' },
  });
  Object.defineProperty(response, 'url', { value: source });
  return response;
}

describe('bounded independent live original GET', () => {
  it('cancels a stream as soon as it exceeds the declared length', async () => {
    let canceled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
      },
      cancel() {
        canceled = true;
      },
    });
    await expect(
      fetchBoundedLiveOriginal(source, 'jpg', async () => responseFor(stream, 1))
    ).rejects.toThrow('streamed beyond');
    expect(canceled).toBe(true);
  });

  it('returns only a complete bounded stream with an exact URL and MIME', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.close();
      },
    });
    const result = await fetchBoundedLiveOriginal(source, 'jpg', async () =>
      responseFor(stream, 2)
    );
    expect([...result.bytes]).toEqual([1, 2]);
    expect(result.contentLength).toBe(2);
  });
});
