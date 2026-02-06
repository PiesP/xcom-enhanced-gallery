/**
 * @fileoverview Streaming ZIP writer for progressive ZIP generation
 * @description Pipelined file downloads and ZIP assembly with immediate Local File Headers
 */

import { calculateCRC32, encodeUtf8, writeUint16LE, writeUint32LE } from './zip-utils';

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
  readonly data: Uint8Array;
  readonly offset: number;
  readonly crc32: number;
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
  private currentOffset = 0;

  /**
   * Add file to archive (streaming mode)
   * Writes Local File Header + File Data immediately
   * @param filename - Name of file in archive
   * @param data - File content bytes
   * @throws Error if archive/entry would exceed Zip32 limits
   */
  addFile(filename: string, data: Uint8Array): void {
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
    const crc32 = calculateCRC32(data);

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
    this.entries.push({ filename, data, offset: this.currentOffset, crc32 });
    this.currentOffset += localHeader.length + data.length;
  }

  /**
   * Finalize ZIP file (add Central Directory)
   * @returns Complete ZIP archive as Uint8Array
   * @throws Error if archive exceeds Zip32 limits
   */
  finalize(): Uint8Array {
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

    const centralDirChunks: Uint8Array[] = [];

    for (const entry of this.entries) {
      const filenameBytes = encodeUtf8(entry.filename);
      assertZip32(entry.offset < ZIP_CONST.MAX_UINT32, `entry offset overflow (${entry.offset})`);
      assertZip32(
        entry.data.length < ZIP_CONST.MAX_UINT32,
        `entry too large (size=${entry.data.length})`
      );
      centralDirChunks.push(
        concat([
          ZIP_CONST.SIG_CENTRAL_DIR,
          writeUint16LE(ZIP_CONST.VERSION),
          writeUint16LE(ZIP_CONST.VERSION),
          writeUint16LE(ZIP_CONST.UTF8_FLAG),
          writeUint16LE(0), // No compression
          writeUint16LE(0), // Time
          writeUint16LE(0), // Date
          writeUint32LE(entry.crc32),
          writeUint32LE(entry.data.length),
          writeUint32LE(entry.data.length),
          writeUint16LE(filenameBytes.length),
          writeUint16LE(0), // Extra
          writeUint16LE(0), // Comment
          writeUint16LE(0), // Disk
          writeUint16LE(0), // Internal attrs
          writeUint32LE(0), // External attrs
          writeUint32LE(entry.offset),
          filenameBytes,
        ])
      );
    }

    const centralDir = concat(centralDirChunks);
    assertZip32(
      centralDir.length < ZIP_CONST.MAX_UINT32,
      `central directory too large (size=${centralDir.length})`
    );

    const endOfCentralDir = concat([
      ZIP_CONST.SIG_END_CENTRAL_DIR,
      writeUint16LE(0), // Disk number
      writeUint16LE(0), // Central dir disk
      writeUint16LE(this.entries.length),
      writeUint16LE(this.entries.length),
      writeUint32LE(centralDir.length),
      writeUint32LE(centralDirStart),
      writeUint16LE(0), // Comment length
    ]);

    return concat([...this.chunks, centralDir, endOfCentralDir]);
  }
}
