// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { StreamingZipWriter } from '@shared/external/zip/streaming-zip-writer';
import { afterEach, describe, expect, it, vi } from 'vitest';

const BASELINE_ZIP_HEX =
  '504b0304140000080000000000002639f4cb09000000090000000900000066697273742e747874313233343536373839504b0304140000080000000000002438b23f04000000040000000a0000007365636f6e642e62696e000102ff504b01021400140000080000000000002639f4cb090000000900000009000000000000000000000000000000000066697273742e747874504b01021400140000080000000000002438b23f04000000040000000a00000000000000000000000000300000007365636f6e642e62696e504b050600000000020002006f0000005c0000000000';

async function archiveBytes(writer: StreamingZipWriter): Promise<Uint8Array> {
  return new Uint8Array(await new Blob(writer.finalize()).arrayBuffer());
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function findBytes(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i += 1) {
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

describe('StreamingZipWriter cooperative CRC32', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves the existing ZIP bytes and CRC32 values', async () => {
    const writer = new StreamingZipWriter();
    await writer.addFile('first.txt', new TextEncoder().encode('123456789'));
    await writer.addFile('second.bin', new Uint8Array([0, 1, 2, 255]));

    const bytes = await archiveBytes(writer);
    expect(toHex(bytes)).toBe(BASELINE_ZIP_HEX);
  });

  it('yields during a large single file and preserves overlapping call order', async () => {
    const schedulerYield = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('scheduler', { yield: schedulerYield });
    const writer = new StreamingZipWriter();
    const first = writer.addFile('first-large.bin', new Uint8Array(2 * 1024 * 1024 + 1));
    const second = writer.addFile('second-small.bin', new Uint8Array([1, 2, 3]));

    await Promise.all([first, second]);

    expect(schedulerYield).toHaveBeenCalledTimes(2);
    const bytes = await archiveBytes(writer);
    const encoder = new TextEncoder();
    expect(findBytes(bytes, encoder.encode('first-large.bin'))).toBeLessThan(
      findBytes(bytes, encoder.encode('second-small.bin'))
    );
  });

  it('aborts between CRC32 chunks without adding a partial entry', async () => {
    const controller = new AbortController();
    vi.stubGlobal('scheduler', {
      yield: vi.fn(async () => {
        controller.abort();
      }),
    });
    const writer = new StreamingZipWriter();

    await expect(
      writer.addFile('cancelled.bin', new Uint8Array(2 * 1024 * 1024), {
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
    await writer.addFile('after.txt', new TextEncoder().encode('ok'));

    const archiveText = new TextDecoder().decode(await archiveBytes(writer));
    expect(archiveText).not.toContain('cancelled.bin');
    expect(archiveText).toContain('after.txt');
  });
});
