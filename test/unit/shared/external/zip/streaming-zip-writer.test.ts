// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import {
  BorrowedZipBlob,
  StreamingZipWriter,
  ZipResourceLimitError,
} from '@shared/external/zip/streaming-zip-writer';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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
      if (haystack[i + j] !== needle[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

describe('StreamingZipWriter cooperative CRC32', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('preserves the existing ZIP bytes and CRC32 values', async () => {
    const writer = new StreamingZipWriter();
    await writer.addFile('first.txt', new TextEncoder().encode('123456789'));
    await writer.addFile('second.bin', new Uint8Array([0, 1, 2, 255]));

    const bytes = await archiveBytes(writer);
    expect(toHex(bytes)).toBe(BASELINE_ZIP_HEX);
  });

  it.each([
    [15, 0x5e7c4095],
    [31, 0xefd50db4],
  ])('publishes the live length and CRC after a shrink to a %i-byte tail', async (tail, crc) => {
    const stripe = 1024 * 1024;
    const offset = 7;
    const backing = new ArrayBuffer(offset + 2 * stripe + 257, { maxByteLength: 4 * stripe });
    const source = new Uint8Array(backing, offset);
    for (let i = 0; i < source.length; i++) {
      source[i] = (i * 13 + (i >>> 9)) & 0xff;
    }
    const size = stripe + tail;
    const yieldOnce = vi.fn(async () => backing.resize(offset + size));
    vi.stubGlobal('scheduler', { yield: yieldOnce });
    const writer = new StreamingZipWriter();
    await writer.addFile('v', source);
    const bytes = await archiveBytes(writer);
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(yieldOnce).toHaveBeenCalledOnce();
    expect(header.getUint32(18, true)).toBe(size);
    expect(header.getUint32(14, true)).toBe(crc);
    expect(header.getUint32(31 + size, true)).toBe(0x02014b50);
    expect(header.getUint32(31 + size + 16, true)).toBe(crc);
    expect(header.getUint32(31 + size + 24, true)).toBe(size);
    expect(header.getUint32(bytes.length - 6, true)).toBe(31 + size);
  });

  it('uses only the declared bytes of a fixed subview with a larger backing', async () => {
    const data = new Uint8Array(1024 * 1024 + 79);
    data.fill(247);
    const source = data.subarray(7, 1024 * 1024 + 38);
    for (let i = 0; i < source.length; i++) {
      source[i] = (i * 13 + (i >>> 9)) & 0xff;
    }
    const writer = new StreamingZipWriter();
    await writer.addFile('v', source);
    const bytes = await archiveBytes(writer);
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(header.getUint32(18, true)).toBe(source.length);
    expect(header.getUint32(14, true)).toBe(0xefd50db4);
    expect(header.getUint32(31 + source.length + 16, true)).toBe(0xefd50db4);
  });

  it.each(['grow', 'truncate'])(
    'releases the reservation after a disallowed %s at yield',
    async (change) => {
      const stripe = 1024 * 1024;
      const backing = new ArrayBuffer(stripe + 16, { maxByteLength: 2 * stripe });
      const data = new Uint8Array(backing);
      vi.stubGlobal('scheduler', {
        yield: async () => backing.resize(change === 'grow' ? stripe + 17 : stripe - 1),
      });
      const writer = new StreamingZipWriter();
      await expect(writer.addFile('invalid.bin', data)).rejects.toThrow(
        change === 'grow' ? /reservation/u : /truncated/u
      );
      await writer.addFile('next.bin', new Uint8Array([42]));
      const bytes = await archiveBytes(writer);
      expect(findBytes(bytes, new TextEncoder().encode('invalid.bin'))).toBe(-1);
      expect(findBytes(bytes, new TextEncoder().encode('next.bin'))).toBe(30);
    }
  );

  it('produces the same archive across Blob checksum boundaries', async () => {
    const data = new Uint8Array(1024 * 1024 + 1);
    data[0] = 3;
    data[data.length - 2] = 127;
    data[data.length - 1] = 251;
    const control = new StreamingZipWriter();
    const candidate = new StreamingZipWriter();
    const source = new Blob([data]);
    await control.addFile('boundary.bin', data);
    const retained = BorrowedZipBlob.from(source);
    expect(retained).toBeDefined();
    if (!retained) {
      throw new Error('Expected a native Blob');
    }
    // A later replacement cannot substitute bytes for the already admitted native body.
    const shadowedStream = vi.spyOn(source, 'stream').mockImplementation(() => {
      throw new Error('custom stream called');
    });
    vi.spyOn(source, 'slice').mockReturnValue(new Blob(['changed']));
    vi.spyOn(source, 'arrayBuffer').mockResolvedValue(new Uint8Array([99]).buffer);
    const reads = vi.spyOn(BorrowedZipBlob.prototype, 'read');
    await candidate.reserveEntry('boundary.bin', data.length).commit(retained);
    expect(reads.mock.calls).toEqual([
      [0, 1024 * 1024],
      [1024 * 1024, data.length],
    ]);
    expect(shadowedStream).not.toHaveBeenCalled();
    expect(candidate.finalize()).toContain(source);
    expect(Buffer.compare(await archiveBytes(candidate), await archiveBytes(control))).toBe(0);
  });

  it('reads a native Blob through one bounded byte stream and preserves exact tail bytes', async () => {
    const chunk = 1024 * 1024;
    const data = new Uint8Array(2 * chunk + 17);
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 251;
    }
    const source = new Blob([data]);
    const retained = BorrowedZipBlob.from(source);
    if (!retained) {
      throw new Error('Expected a native Blob');
    }
    const slices = vi.spyOn(BorrowedZipBlob.prototype, 'read');
    slices.mockClear();
    const read = vi.spyOn(ReadableStreamBYOBReader.prototype, 'read');
    const control = new StreamingZipWriter();
    await control.addFile('body.bin', data);
    const archive = new StreamingZipWriter();
    await archive.reserveEntry('body.bin', data.length).commit(retained);
    const argumentsSeen = read.mock.calls.map(([view, options]) => [view.byteOffset, options?.min]);
    expect(argumentsSeen).toEqual([
      [0, chunk],
      [0, chunk],
      [0, 17],
      [0, undefined],
    ]);
    expect(slices).not.toHaveBeenCalled();
    expect(archive.finalize()).toContain(source);
    expect(Buffer.compare(await archiveBytes(archive), await archiveBytes(control))).toBe(0);
    read.mockRestore();
  });

  it('settles an unsupported byte reader before falling back to bounded native slices', async () => {
    const size = 1024 * 1024 + 3;
    const source = new Blob([new Uint8Array(size)]);
    const body = BorrowedZipBlob.from(source);
    if (!body) {
      throw new Error('Expected a native Blob');
    }
    vi.spyOn(ReadableStream.prototype, 'getReader').mockImplementationOnce(() => {
      throw new TypeError('BYOB unavailable');
    });
    const canceled = vi.spyOn(ReadableStream.prototype, 'cancel');
    const slices = vi.spyOn(BorrowedZipBlob.prototype, 'read');
    const writer = new StreamingZipWriter();
    await writer.reserveEntry('fallback.bin', size).commit(body);
    expect(canceled).toHaveBeenCalledOnce();
    expect(slices.mock.calls).toEqual([
      [0, 1024 * 1024],
      [1024 * 1024, size],
    ]);
    expect(writer.finalize()).toContain(source);
  });

  it('rejects premature stream end and extra bytes before publishing an entry', async () => {
    const size = 1024 * 1024 + 3;
    const source = new Blob([new Uint8Array(size)]);
    const body = BorrowedZipBlob.from(source);
    if (!body) {
      throw new Error('Expected a native Blob');
    }
    for (const actual of [size - 1, size + 1]) {
      const stream = new ReadableStream<Uint8Array>({
        type: 'bytes',
        start(controller) {
          controller.enqueue(new Uint8Array(actual));
          controller.close();
        },
      });
      const reader = stream.getReader({ mode: 'byob' });
      vi.spyOn(BorrowedZipBlob.prototype, 'openByteReader').mockResolvedValueOnce(reader);
      const writer = new StreamingZipWriter();
      // Engines may reject the read themselves when EOF arrives below its requested minimum.
      await expect(writer.reserveEntry('bad.bin', size).commit(body)).rejects.toThrow(
        actual < size ? Error : /source size/u
      );
      expect(stream.locked).toBe(false);
      expect(writer.finalize()).not.toContain(source);
    }
  });

  it('settles stream cancellation before releasing the active reservation', async () => {
    const size = 1024 * 1024 + 3;
    const source = new Blob([new Uint8Array(size)]);
    const body = BorrowedZipBlob.from(source);
    if (!body) {
      throw new Error('Expected a native Blob');
    }
    const reading = Promise.withResolvers<void>();
    const cancelled = Promise.withResolvers<void>();
    const settled = Promise.withResolvers<void>();
    const stream = new ReadableStream<Uint8Array>({
      type: 'bytes',
      pull() {
        reading.resolve();
      },
      async cancel() {
        cancelled.resolve();
        await settled.promise;
      },
    });
    const reader = stream.getReader({ mode: 'byob' });
    vi.spyOn(BorrowedZipBlob.prototype, 'openByteReader').mockResolvedValueOnce(reader);
    const writer = new StreamingZipWriter();
    const controller = new AbortController();
    const pending = writer
      .reserveEntry('cancelled.bin', size)
      .commit(body, { signal: controller.signal });
    const result = pending.then(
      () => false,
      (error) => error instanceof DOMException && error.name === 'AbortError'
    );
    await reading.promise;
    controller.abort();
    await cancelled.promise;
    expect(stream.locked).toBe(true);
    settled.resolve();
    expect(await result).toBe(true);
    expect(stream.locked).toBe(false);
    expect(writer.finalize()).not.toContain(source);
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

  it('accounts for stored local headers, central directory records, names, and EOCD', async () => {
    const filename = 'a';
    const exactArchiveBytes = 22 + 30 + filename.length + 4 + 46 + filename.length;
    const exactWriter = new StreamingZipWriter(exactArchiveBytes);
    await expect(exactWriter.addFile(filename, new Uint8Array(4))).resolves.toBeUndefined();
    expect((await archiveBytes(exactWriter)).byteLength).toBe(exactArchiveBytes);

    const shortWriter = new StreamingZipWriter(exactArchiveBytes - 1);
    await expect(shortWriter.addFile(filename, new Uint8Array(4))).rejects.toBeInstanceOf(
      ZipResourceLimitError
    );
  });

  it('subtracts active reservations so parallel entries cannot overbook capacity', async () => {
    const exactArchiveBytes = 22 + (78 + 4) + (78 + 2);
    const writer = new StreamingZipWriter(exactArchiveBytes);

    const first = writer.reserveEntry('a', 4);
    const second = writer.reserveEntry('b', 4);

    expect(first.maxDataBytes).toBe(4);
    expect(second.maxDataBytes).toBe(2);
    await Promise.all([first.commit(new Uint8Array(4)), second.commit(new Uint8Array(2))]);
    expect((await archiveBytes(writer)).byteLength).toBe(exactArchiveBytes);
  });
});
