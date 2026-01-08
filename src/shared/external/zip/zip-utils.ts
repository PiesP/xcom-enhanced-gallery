/**
 * @fileoverview ZIP utility helpers for CRC32 and byte encoding
 * @description Shared ZIP encoding and checksum functions
 */

const textEncoder = new TextEncoder();

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
 * @param value String to encode
 * @returns Uint8Array with UTF-8 bytes
 */
export function encodeUtf8(value: string): Uint8Array {
  return textEncoder.encode(value);
}

/**
 * Calculate CRC32 checksum using polynomial 0xEDB88320
 * @param data Byte array to checksum
 * @returns 32-bit unsigned CRC32 value
 */
export function calculateCRC32(data: Uint8Array): number {
  const table = ensureCRC32Table();
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ (table[(crc ^ data[i]!) & 0xff] as number);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Encode 16-bit unsigned integer to little-endian bytes
 * @param value 16-bit unsigned integer
 * @returns 2-byte Uint8Array in little-endian order
 */
export function writeUint16LE(value: number): Uint8Array {
  const bytes = new Uint8Array(2);
  bytes[0] = value & 0xff;
  bytes[1] = (value >>> 8) & 0xff;
  return bytes;
}

/**
 * Encode 32-bit unsigned integer to little-endian bytes
 * @param value 32-bit unsigned integer
 * @returns 4-byte Uint8Array in little-endian order
 */
export function writeUint32LE(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  bytes[0] = value & 0xff;
  bytes[1] = (value >>> 8) & 0xff;
  bytes[2] = (value >>> 16) & 0xff;
  bytes[3] = (value >>> 24) & 0xff;
  return bytes;
}
