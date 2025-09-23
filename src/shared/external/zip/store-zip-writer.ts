import { logger } from '@shared/logging';

const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const VERSION_NEEDED_TO_EXTRACT = 20;
const VERSION_MADE_BY = (3 << 8) | VERSION_NEEDED_TO_EXTRACT; // UNIX + version 2.0
const GENERAL_PURPOSE_FLAG_UTF8 = 0x0800;

const textEncoder = new TextEncoder();

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      if ((crc & 1) !== 0) {
        crc = 0xedb88320 ^ (crc >>> 1);
      } else {
        crc >>>= 1;
      }
    }
    table[i] = crc >>> 0;
  }
  return table;
})();

function computeCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i]!;
    const tableIndex = (crc ^ byte) & 0xff;
    const lookup = crcTable[tableIndex]!;
    crc = (crc >>> 8) ^ lookup;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function normalizeToUint8Array(data: Uint8Array | ArrayBuffer | ArrayLike<number>): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView & { length?: number };
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  }
  return Uint8Array.from(data);
}

function clampDosYear(year: number): number {
  if (Number.isNaN(year) || !Number.isFinite(year)) return 1980;
  if (year < 1980) return 1980;
  if (year > 2107) return 2107;
  return year;
}

function toDosDate(date: Date): number {
  const year = clampDosYear(date.getFullYear()) - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return ((year & 0x7f) << 9) | ((month & 0x0f) << 5) | (day & 0x1f);
}

function toDosTime(date: Date): number {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);
  return ((hours & 0x1f) << 11) | ((minutes & 0x3f) << 5) | (seconds & 0x1f);
}

function getLastModifiedDate(): Date {
  return new Date();
}

function buildZipSegments(fileEntries: Array<[string, Uint8Array]>): {
  localSegments: Uint8Array[];
  centralSegments: Uint8Array[];
  centralDirectoryOffset: number;
} {
  const localSegments: Uint8Array[] = [];
  const centralSegments: Uint8Array[] = [];

  let offset = 0;

  for (const [filename, rawData] of fileEntries) {
    if (!filename) {
      throw new Error('ZIP entry name must be a non-empty string');
    }

    const data = normalizeToUint8Array(rawData);
    const nameBytes = textEncoder.encode(filename);
    const crc32 = computeCrc32(data);
    const lastModified = getLastModifiedDate();
    const dosTime = toDosTime(lastModified);
    const dosDate = toDosDate(lastModified);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, LOCAL_FILE_HEADER_SIGNATURE, true);
    localView.setUint16(4, VERSION_NEEDED_TO_EXTRACT, true);
    localView.setUint16(6, GENERAL_PURPOSE_FLAG_UTF8, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, crc32, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    localSegments.push(localHeader, data);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);

    centralView.setUint32(0, CENTRAL_DIRECTORY_HEADER_SIGNATURE, true);
    centralView.setUint16(4, VERSION_MADE_BY, true);
    centralView.setUint16(6, VERSION_NEEDED_TO_EXTRACT, true);
    centralView.setUint16(8, GENERAL_PURPOSE_FLAG_UTF8, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, crc32, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    centralSegments.push(centralHeader);

    offset += localHeader.length + data.length;
  }

  return {
    localSegments,
    centralSegments,
    centralDirectoryOffset: offset,
  };
}

function assembleZip(
  localSegments: Uint8Array[],
  centralSegments: Uint8Array[],
  centralDirectoryOffset: number
): Uint8Array {
  const centralDirectorySize = centralSegments.reduce((acc, segment) => acc + segment.length, 0);
  const totalEntries = centralSegments.length;
  const endOfCentralDirectory = new Uint8Array(22);
  const endView = new DataView(endOfCentralDirectory.buffer);

  endView.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, totalEntries, true);
  endView.setUint16(10, totalEntries, true);
  endView.setUint32(12, centralDirectorySize, true);
  endView.setUint32(16, centralDirectoryOffset, true);
  endView.setUint16(20, 0, true);

  const localLength = centralDirectoryOffset;
  const totalLength = localLength + centralDirectorySize + endOfCentralDirectory.length;
  const output = new Uint8Array(totalLength);

  let cursor = 0;
  for (const segment of localSegments) {
    output.set(segment, cursor);
    cursor += segment.length;
  }
  for (const segment of centralSegments) {
    output.set(segment, cursor);
    cursor += segment.length;
  }
  if (process.env.NODE_ENV === 'test') {
    logger.debug('[StoreZipWriter] EOCD header', {
      header: Array.from(endOfCentralDirectory.slice(0, 4)),
      cursor,
      totalLength,
    });
  }
  output.set(endOfCentralDirectory, cursor);

  return output;
}

export function createStoreZipUint8Array(fileData: Map<string, Uint8Array>): Uint8Array {
  if (fileData.size === 0) {
    throw new Error('Cannot create ZIP archive without files');
  }

  const entries = Array.from(fileData.entries());
  try {
    const { localSegments, centralSegments, centralDirectoryOffset } = buildZipSegments(entries);
    const zip = assembleZip(localSegments, centralSegments, centralDirectoryOffset);
    if (process.env.NODE_ENV === 'test') {
      const tail = Array.from(zip.slice(-4));
      const signatureBytes = Array.from(zip.slice(-22, -18));
      const signatureValue = new DataView(zip.buffer, zip.byteOffset, zip.byteLength).getUint32(
        zip.length - 22,
        true
      );
      logger.debug('[StoreZipWriter] Tail bytes', { tail, signatureBytes, signatureValue });
    }
    return zip;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('[StoreZipWriter] Failed to assemble ZIP archive:', message);
    throw error;
  }
}

export async function createStoreZipBlob(fileData: Map<string, Uint8Array>): Promise<Blob> {
  const zipData = createStoreZipUint8Array(fileData);
  if (process.env.NODE_ENV === 'test') {
    logger.debug('[StoreZipWriter] Blob payload size', { bytes: zipData.byteLength });
  }
  const cloned = zipData.slice();
  return new Blob([cloned], { type: 'application/zip' });
}
