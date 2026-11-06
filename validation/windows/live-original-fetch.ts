// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

const MAX_ORIGINAL_BYTES = 4 * 1024 * 1024;

/** Fetch a public selected original independently, enforcing the cap before each retained chunk. */
export async function fetchBoundedLiveOriginal(
  sourceUrl: string,
  format: string,
  fetcher: typeof fetch = fetch
): Promise<{ bytes: Buffer; contentType: string; contentLength: number }> {
  assert(/^(?:jpg|jpeg|png|gif|webp)$/u.test(format));
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(new Error('Live original GET timed out')), 20_000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetcher(sourceUrl, {
      method: 'GET',
      redirect: 'error',
      signal: abort.signal,
      credentials: 'omit',
    });
    assert.equal(response.url, sourceUrl, 'Independent original redirected');
    assert.equal(response.status, 200, 'Independent original GET failed');
    const contentType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ?? '';
    assert.equal(contentType, 'image/' + (format === 'jpg' ? 'jpeg' : format));
    const contentLength = Number(response.headers.get('content-length'));
    assert(
      Number.isSafeInteger(contentLength) &&
        contentLength > 0 &&
        contentLength <= MAX_ORIGINAL_BYTES,
      'Independent original has no bounded content length'
    );
    assert(response.body, 'Independent original has no response body');
    reader = response.body.getReader();
    const parts: Buffer[] = [];
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      assert(value instanceof Uint8Array, 'Independent original yielded non-byte data');
      assert(
        total + value.byteLength <= contentLength && total + value.byteLength <= MAX_ORIGINAL_BYTES,
        'Independent original streamed beyond its declared bound'
      );
      total += value.byteLength;
      parts.push(Buffer.from(value));
    }
    assert.equal(total, contentLength, 'Independent original stream ended early');
    return { bytes: Buffer.concat(parts, total), contentType, contentLength };
  } finally {
    await reader?.cancel().catch(() => {});
    abort.abort();
    clearTimeout(timeout);
  }
}
