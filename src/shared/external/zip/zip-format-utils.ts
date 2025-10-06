/**
 * @fileoverview ZIP Format Utilities - Store-only ZIP implementation
 * @description Phase 1.1 - CRC32, DOS datetime conversion, Little-endian byte writing
 * @version 1.0.0
 */

/**
 * CRC32 lookup table (IEEE 802.3 standard)
 * Pre-computed for performance
 */
const CRC32_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

/**
 * Calculate CRC32 checksum for given data
 * Uses IEEE 802.3 polynomial (0xEDB88320)
 *
 * @param data - Data to calculate CRC32 for
 * @returns CRC32 checksum as unsigned 32-bit integer
 *
 * @example
 * ```typescript
 * const data = new TextEncoder().encode('hello world');
 * const crc = calculateCRC32(data); // 0x0D4A1185
 * ```
 */
export function calculateCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte === undefined) continue;
    crc = (crc >>> 8) ^ (CRC32_TABLE[(crc ^ byte) & 0xff] ?? 0);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * DOS date/time format
 */
export interface DosDateTime {
  /** DOS date: ((year-1980) << 9) | (month << 5) | day */
  dosDate: number;
  /** DOS time: (hour << 11) | (minute << 5) | (second/2) */
  dosTime: number;
}

/**
 * Convert JavaScript Date to DOS date/time format
 *
 * DOS date format (16-bit):
 * - Bits 0-4: Day of month (1-31)
 * - Bits 5-8: Month (1-12)
 * - Bits 9-15: Year offset from 1980 (0-127, representing 1980-2107)
 *
 * DOS time format (16-bit):
 * - Bits 0-4: Second divided by 2 (0-29)
 * - Bits 5-10: Minute (0-59)
 * - Bits 11-15: Hour (0-23)
 *
 * @param date - JavaScript Date object
 * @returns DOS date and time components
 *
 * @example
 * ```typescript
 * const date = new Date('2025-10-06T14:30:00');
 * const { dosDate, dosTime } = toDosDateTime(date);
 * // dosDate: 23366, dosTime: 29632
 * ```
 */
export function toDosDateTime(date: Date): DosDateTime {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-based to 1-based
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // DOS date: ((year-1980) << 9) | (month << 5) | day
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;

  // DOS time: (hour << 11) | (minute << 5) | (second/2)
  // Note: seconds are divided by 2 (2-second precision)
  const dosTime = (hour << 11) | (minute << 5) | Math.floor(second / 2);

  return { dosDate, dosTime };
}

/**
 * Little-endian byte writer for ZIP format
 *
 * Provides methods to write various integer types and byte arrays
 * in little-endian format (LSB first).
 *
 * @example
 * ```typescript
 * const writer = new ByteWriter();
 * writer.writeUint32LE(0x04034b50); // Local file header signature
 * writer.writeUint16LE(10); // Version
 * const buffer = writer.getBuffer();
 * ```
 */
export class ByteWriter {
  private readonly chunks: Uint8Array[] = [];

  /**
   * Write unsigned 8-bit integer
   * @param value - Value to write (0-255)
   */
  writeUint8(value: number): void {
    this.chunks.push(new Uint8Array([value & 0xff]));
  }

  /**
   * Write unsigned 16-bit integer (little-endian)
   * @param value - Value to write (0-65535)
   */
  writeUint16LE(value: number): void {
    this.chunks.push(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  /**
   * Write unsigned 32-bit integer (little-endian)
   * @param value - Value to write (0-4294967295)
   */
  writeUint32LE(value: number): void {
    this.chunks.push(
      new Uint8Array([
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff,
      ])
    );
  }

  /**
   * Write byte array
   * @param data - Bytes to write
   */
  writeBytes(data: Uint8Array): void {
    if (data.length > 0) {
      this.chunks.push(data);
    }
  }

  /**
   * Get accumulated buffer
   * Creates a new concatenated Uint8Array from all chunks
   *
   * @returns Complete buffer with all written data
   */
  getBuffer(): Uint8Array {
    if (this.chunks.length === 0) {
      return new Uint8Array(0);
    }

    if (this.chunks.length === 1 && this.chunks[0]) {
      return this.chunks[0];
    }

    // Calculate total length
    let totalLength = 0;
    for (const chunk of this.chunks) {
      totalLength += chunk.length;
    }

    // Concatenate all chunks
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return result;
  }
}
