import { describe, it, expect } from 'vitest';
import { TextDecoder, TextEncoder } from 'node:util';
import { createStoreZipBlob } from '@shared/external/zip/store-zip-writer';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8', { fatal: true });

const debugLog = (...args: unknown[]) => {
  const consoleLike: { log?: (...logArgs: unknown[]) => void } =
    (globalThis as typeof globalThis & { console?: { log?: (...logArgs: unknown[]) => void } })
      .console ?? {};
  if (typeof consoleLike.log === 'function') {
    consoleLike.log(...args);
  }
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const UTF8_GENERAL_PURPOSE_FLAG = 0x0800;

interface EndOfCentralDirectory {
  readonly offset: number;
  readonly totalEntries: number;
  readonly centralDirectorySize: number;
  readonly centralDirectoryOffset: number;
  readonly commentLength: number;
}

interface CentralDirectoryEntry {
  readonly name: string;
  readonly generalPurposeFlag: number;
  readonly compressionMethod: number;
  readonly crc32: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly relativeOffsetOfLocalHeader: number;
}

interface LocalFileEntry {
  readonly name: string;
  readonly generalPurposeFlag: number;
  readonly compressionMethod: number;
  readonly crc32: number;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly data: Uint8Array;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      if ((c & 1) !== 0) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c >>>= 1;
      }
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    const index = (crc ^ byte) & 0xff;
    crc = (crc >>> 8) ^ crcTable[index];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function parseEndOfCentralDirectory(bytes: Uint8Array): EndOfCentralDirectory {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let offset = bytes.byteLength - 22; offset >= 0; offset--) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) {
      const totalEntries = view.getUint16(offset + 10, true);
      const centralDirectorySize = view.getUint32(offset + 12, true);
      const centralDirectoryOffset = view.getUint32(offset + 16, true);
      const commentLength = view.getUint16(offset + 20, true);
      return {
        offset,
        totalEntries,
        centralDirectorySize,
        centralDirectoryOffset,
        commentLength,
      };
    }
  }
  throw new Error('End of central directory signature not found');
}

function parseCentralDirectory(
  bytes: Uint8Array,
  view: DataView,
  start: number,
  entryCount: number
): { entries: CentralDirectoryEntry[]; endOffset: number } {
  const entries: CentralDirectoryEntry[] = [];
  let cursor = start;

  for (let i = 0; i < entryCount; i++) {
    const signature = view.getUint32(cursor, true);
    expect(signature).toBe(CENTRAL_DIRECTORY_SIGNATURE);

    const generalPurposeFlag = view.getUint16(cursor + 8, true);
    const compressionMethod = view.getUint16(cursor + 10, true);
    const crc32 = view.getUint32(cursor + 16, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const uncompressedSize = view.getUint32(cursor + 24, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const relativeOffsetOfLocalHeader = view.getUint32(cursor + 42, true);

    const nameBytes = new Uint8Array(bytes.buffer, bytes.byteOffset + cursor + 46, fileNameLength);
    const name = textDecoder.decode(nameBytes);

    entries.push({
      name,
      generalPurposeFlag,
      compressionMethod,
      crc32,
      compressedSize,
      uncompressedSize,
      relativeOffsetOfLocalHeader,
    });

    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return { entries, endOffset: cursor };
}

function parseLocalFileHeader(bytes: Uint8Array, view: DataView, offset: number): LocalFileEntry {
  const signature = view.getUint32(offset, true);
  expect(signature).toBe(LOCAL_FILE_SIGNATURE);

  const generalPurposeFlag = view.getUint16(offset + 6, true);
  const compressionMethod = view.getUint16(offset + 8, true);
  const crc32 = view.getUint32(offset + 14, true);
  const compressedSize = view.getUint32(offset + 18, true);
  const uncompressedSize = view.getUint32(offset + 22, true);
  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);

  const nameBytes = new Uint8Array(bytes.buffer, bytes.byteOffset + offset + 30, fileNameLength);
  const name = textDecoder.decode(nameBytes);

  const dataStart = offset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + compressedSize;
  const data = bytes.slice(dataStart, dataEnd);

  return {
    name,
    generalPurposeFlag,
    compressionMethod,
    crc32,
    compressedSize,
    uncompressedSize,
    data,
  };
}

describe('StoreZipWriter', () => {
  it('produces a valid stored ZIP archive with central directory', async () => {
    const files = new Map<string, Uint8Array>();
    files.set('hello.txt', textEncoder.encode('Hello ZIP!'));
    files.set('nested/data.bin', new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff]));

    const blob = await createStoreZipBlob(files);
    expect(blob.type).toBe('application/zip');
    expect(blob.size).toBeGreaterThan(0);

    const arrayBuffer = await blob.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThanOrEqual(blob.size);

    const bytes = new Uint8Array(arrayBuffer.slice(0));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    for (let offset = bytes.length - 22; offset >= 0; offset--) {
      const value = view.getUint32(offset, true);
      if (value === EOCD_SIGNATURE) {
        break;
      }
    }

    expect(view.getUint32(bytes.byteLength - 22, true)).toBe(EOCD_SIGNATURE);

    const eocd = parseEndOfCentralDirectory(bytes);
    expect(eocd.commentLength).toBe(0);

    const { entries, endOffset } = parseCentralDirectory(
      bytes,
      view,
      eocd.centralDirectoryOffset,
      eocd.totalEntries
    );

    expect(entries).toHaveLength(files.size);
    expect(endOffset - eocd.centralDirectoryOffset).toBe(eocd.centralDirectorySize);

    const expectedNames = Array.from(files.keys());
    expect(entries.map(entry => entry.name)).toEqual(expectedNames);

    for (const entry of entries) {
      expect(entry.compressionMethod).toBe(0);
      expect(entry.generalPurposeFlag & UTF8_GENERAL_PURPOSE_FLAG).toBe(UTF8_GENERAL_PURPOSE_FLAG);
      expect(entry.compressedSize).toBe(entry.uncompressedSize);

      const localEntry = parseLocalFileHeader(bytes, view, entry.relativeOffsetOfLocalHeader);
      expect(localEntry.name).toBe(entry.name);
      expect(localEntry.generalPurposeFlag).toBe(entry.generalPurposeFlag);
      expect(localEntry.compressionMethod).toBe(entry.compressionMethod);
      expect(localEntry.compressedSize).toBe(entry.compressedSize);
      expect(localEntry.uncompressedSize).toBe(entry.uncompressedSize);

      const original = files.get(entry.name);
      expect(original).toBeDefined();
      expect(localEntry.data).toHaveLength(original?.length ?? 0);
      expect(Array.from(localEntry.data)).toEqual(Array.from(original!));

      const expectedCrc = computeCrc32(original!);
      expect(entry.crc32).toBe(expectedCrc);
      expect(localEntry.crc32).toBe(expectedCrc);
    }
  });
});
