// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Streaming ZIP writer for progressive ZIP generation
 * @description Pipelined file downloads and ZIP assembly with immediate Local File Headers
 */

import { schedulerYield } from '@shared/utils/performance/scheduler-yield';

const textEncoder = new TextEncoder();
const CRC32_CHUNK_SIZE = 1024 * 1024;

let crc32Table: Uint32Array | null = null;

/**
 * Lazily initialize and cache CRC32 lookup table (polynomial 0xEDB88320)
 * @returns Cached 256-element Uint32Array
 * @internal
 */
function ensureCRC32Table(): Uint32Array {
  if (crc32Table) {
    return crc32Table;
  }

  const table = new Uint32Array(256);
  const polynomial = 0xedb88320;

  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ polynomial : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }

  crc32Table = table;
  return table;
}

/**
 * Encode UTF-8 string to byte array
 * @param value - String to encode
 * @returns Uint8Array with UTF-8 bytes
 */
function encodeUtf8(value: string): Uint8Array {
  return textEncoder.encode(value);
}

/**
 * Calculate CRC32 checksum using polynomial 0xEDB88320 without monopolizing
 * the main thread for a large single file.
 * @param data - Byte array to checksum
 * @param signal - Optional cancellation signal
 * @returns 32-bit unsigned CRC32 value
 */
async function calculateCRC32(data: Uint8Array, signal?: AbortSignal): Promise<number> {
  const table = ensureCRC32Table();
  let crc = 0xffffffff;

  for (let chunkStart = 0; chunkStart < data.length; chunkStart += CRC32_CHUNK_SIZE) {
    signal?.throwIfAborted();
    const chunkEnd = Math.min(chunkStart + CRC32_CHUNK_SIZE, data.length);
    for (let i = chunkStart; i < chunkEnd; i++) {
      crc = (crc >>> 8) ^ (table[(crc ^ data[i]!) & 0xff] as number);
    }

    if (chunkEnd < data.length) {
      await schedulerYield(0);
      signal?.throwIfAborted();
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Encode 16-bit unsigned integer to little-endian bytes
 * @param value - 16-bit unsigned integer
 * @returns 2-byte Uint8Array in little-endian order
 */
function writeUint16LE(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  bytes[0] = value & 0xff;
  bytes[1] = (value >>> 8) & 0xff;
  return bytes;
}

/**
 * Encode 32-bit unsigned integer to little-endian bytes
 * @param value - 32-bit unsigned integer
 * @returns 4-byte Uint8Array in little-endian order
 */
function writeUint32LE(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  bytes[0] = value & 0xff;
  bytes[1] = (value >>> 8) & 0xff;
  bytes[2] = (value >>> 16) & 0xff;
  bytes[3] = (value >>> 24) & 0xff;
  return bytes;
}

const ZIP_CONST = {
  MAX_UINT16: 0xffff,
  MAX_UINT32: 0xffff_ffff,
  ZIP32_ERROR: 'Zip32 limit exceeded',
  SIG_LOCAL_HEADER: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
  SIG_CENTRAL_DIR: new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
  SIG_END_CENTRAL_DIR: new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
  UTF8_FLAG: 0x0800,
  VERSION: 20,
} as const;

function assertZip32(condition: boolean, message: string): asserts condition {
  if (condition) return;
  if (__DEV__) {
    throw new Error(`ZIP format limit exceeded (Zip64 not supported): ${message}`);
  }
  throw new Error(ZIP_CONST.ZIP32_ERROR);
}

/** @internal */
interface FileEntry {
  readonly filename: string;
  readonly size: number;
  readonly offset: number;
  readonly crc32: number;
}

export class ZipResourceLimitError extends Error {
  override readonly name = 'ZipResourceLimitError';
}

/** Optimized buffer concatenation (no function call overhead) */
const concat = (arrays: readonly Uint8Array[]): Uint8Array => {
  let len = 0;
  for (const array of arrays) len += array.length;
  const result = new Uint8Array(len);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
};

/**
 * Streaming ZIP writer with immediate Local File Header writes
 * Finalize() adds Central Directory to complete the ZIP
 */
export class StreamingZipWriter {
  private readonly chunks: Uint8Array[] = [];
  private readonly entries: FileEntry[] = [];
  private pendingAdd: Promise<void> = Promise.resolve();
  private currentOffset = 0;

  constructor(private readonly maxArchiveBytes = Number.MAX_SAFE_INTEGER) {}

  /**
   * Add file to archive (streaming mode)
   * Writes Local File Header + File Data immediately
   * @param filename - Name of file in archive
   * @param data - File content bytes
   * @param options - Optional cancellation signal checked between CRC32 chunks
   * @throws Error if archive/entry would exceed Zip32 limits
   */
  addFile(
    filename: string,
    data: Uint8Array,
    options: { signal?: AbortSignal } = {}
  ): Promise<void> {
    const operation = this.pendingAdd.then(() =>
      this.addFileInOrder(filename, data, options.signal)
    );
    this.pendingAdd = operation.catch(() => undefined);
    return operation;
  }

  private async addFileInOrder(
    filename: string,
    data: Uint8Array,
    signal?: AbortSignal
  ): Promise<void> {
    signal?.throwIfAborted();
    // Zip32-only: entry count fits in 16-bit EOCD fields, sizes in 32-bit fields
    assertZip32(
      this.entries.length < ZIP_CONST.MAX_UINT16 - 1,
      `too many entries (count=${this.entries.length + 1})`
    );

    assertZip32(data.length < ZIP_CONST.MAX_UINT32, `file too large (size=${data.length})`);
    assertZip32(
      this.currentOffset < ZIP_CONST.MAX_UINT32,
      `offset overflow (offset=${this.currentOffset})`
    );

    const filenameBytes = encodeUtf8(filename);
    if (this.currentOffset + data.length > this.maxArchiveBytes) {
      throw new ZipResourceLimitError(
        `Bulk ZIP limit exceeded: archive payload would exceed ${this.maxArchiveBytes} bytes`
      );
    }
    const crc32 = await calculateCRC32(data, signal);
    signal?.throwIfAborted();

    // Local File Header (30 bytes + filename length)
    const localHeader = concat([
      ZIP_CONST.SIG_LOCAL_HEADER,
      writeUint16LE(ZIP_CONST.VERSION),
      writeUint16LE(ZIP_CONST.UTF8_FLAG),
      writeUint16LE(0), // No compression
      writeUint16LE(0), // Time
      writeUint16LE(0), // Date
      writeUint32LE(crc32),
      writeUint32LE(data.length),
      writeUint32LE(data.length),
      writeUint16LE(filenameBytes.length),
      writeUint16LE(0), // No extra field
      filenameBytes,
    ]);

    assertZip32(
      this.currentOffset + localHeader.length + data.length < ZIP_CONST.MAX_UINT32,
      `archive too large (offset=${this.currentOffset}, add=${localHeader.length + data.length})`
    );

    this.chunks.push(localHeader, data);
    this.entries.push({ filename, size: data.length, offset: this.currentOffset, crc32 });
    this.currentOffset += localHeader.length + data.length;
  }

  /**
   * Finalize ZIP file (add Central Directory).
   *
   * Returns an array of parts suitable for `new Blob(parts, {type:'application/zip'})`.
   * Unlike the previous implementation, this does NOT allocate a monolithic
   * Uint8Array — the Blob constructor natively concatenates the parts without
   * duplicating data in JS heap, halving peak memory (~4× → ~2× archive size).
   *
   * @returns BlobPart[] — file data chunks followed by central directory + EOCD
   * @throws Error if archive exceeds Zip32 limits
   */
  finalize(): BlobPart[] {
    // Zip32-only: entry count must fit in 16-bit EOCD fields
    assertZip32(
      this.entries.length < ZIP_CONST.MAX_UINT16,
      `too many entries (count=${this.entries.length})`
    );

    const centralDirStart = this.currentOffset;
    assertZip32(
      centralDirStart < ZIP_CONST.MAX_UINT32,
      `central directory offset overflow (${centralDirStart})`
    );

    // Build central directory as a separate buffer
    let centralDirSize = 0;
    for (const entry of this.entries) {
      centralDirSize += 46 + encodeUtf8(entry.filename).length;
    }
    const eocdSize = 22;
    assertZip32(
      centralDirStart + centralDirSize + eocdSize <= ZIP_CONST.MAX_UINT32,
      `final archive size overflow (${centralDirStart + centralDirSize + eocdSize})`
    );

    const centralDir = new Uint8Array(centralDirSize);
    let pos = 0;

    for (const entry of this.entries) {
      const filenameBytes = encodeUtf8(entry.filename);
      assertZip32(entry.offset < ZIP_CONST.MAX_UINT32, `entry offset overflow (${entry.offset})`);
      assertZip32(entry.size < ZIP_CONST.MAX_UINT32, `entry too large (size=${entry.size})`);

      centralDir.set(ZIP_CONST.SIG_CENTRAL_DIR, pos);
      pos += 4;
      centralDir.set(writeUint16LE(ZIP_CONST.VERSION), pos);
      pos += 2;
      centralDir.set(writeUint16LE(ZIP_CONST.VERSION), pos);
      pos += 2;
      centralDir.set(writeUint16LE(ZIP_CONST.UTF8_FLAG), pos);
      pos += 2;
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // No compression
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Time
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Date
      centralDir.set(writeUint32LE(entry.crc32), pos);
      pos += 4;
      centralDir.set(writeUint32LE(entry.size), pos);
      pos += 4;
      centralDir.set(writeUint32LE(entry.size), pos);
      pos += 4;
      centralDir.set(writeUint16LE(filenameBytes.length), pos);
      pos += 2;
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Extra
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Comment
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Disk
      centralDir.set(writeUint16LE(0), pos);
      pos += 2; // Internal attrs
      centralDir.set(writeUint32LE(0), pos);
      pos += 4; // External attrs
      centralDir.set(writeUint32LE(entry.offset), pos);
      pos += 4;
      centralDir.set(filenameBytes, pos);
      pos += filenameBytes.length;
    }

    // Build End of Central Directory (22 bytes)
    const eocd = new Uint8Array(22);
    let epos = 0;
    eocd.set(ZIP_CONST.SIG_END_CENTRAL_DIR, epos);
    epos += 4;
    eocd.set(writeUint16LE(0), epos);
    epos += 2; // Disk number
    eocd.set(writeUint16LE(0), epos);
    epos += 2; // Central dir disk
    eocd.set(writeUint16LE(this.entries.length), epos);
    epos += 2;
    eocd.set(writeUint16LE(this.entries.length), epos);
    epos += 2;
    eocd.set(writeUint32LE(centralDirSize), epos);
    epos += 4;
    eocd.set(writeUint32LE(centralDirStart), epos);
    epos += 4;
    eocd.set(writeUint16LE(0), epos); // Comment length

    // Return parts: file data chunks + central directory + EOCD.
    // Blob constructor natively concatenates without duplicating in JS heap.
    // Cast required: Uint8Array<ArrayBufferLike> is not assignable to BlobPart
    // because SharedArrayBuffer lacks resizable/resize/transfer/etc.
    return [...this.chunks, centralDir, eocd] as unknown as BlobPart[];
  }
}
