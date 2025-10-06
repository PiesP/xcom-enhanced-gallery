/**
 * ZIP 구조 생성 (Store-only, 압축 없음)
 * @file src/shared/external/zip/zip-creator-native.ts
 *
 * ZIP 포맷 구조:
 * 1. Local File Header(s) + 파일 데이터
 * 2. Central Directory Header(s)
 * 3. End of Central Directory Record
 *
 * 참고: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

import { calculateCRC32, toDosDateTime, ByteWriter } from './zip-format-utils';

/**
 * ZIP 생성 옵션
 */
export interface ZipCreationOptions {
  /** 파일 수정 날짜/시간 (기본값: 현재 시각) */
  date?: Date;
}

/**
 * 파일 맵에서 Store-only ZIP 생성
 *
 * @param files - 파일명: 데이터 매핑 (키: 파일명, 값: Uint8Array)
 * @param options - ZIP 생성 옵션
 * @returns ZIP 바이트 배열
 *
 * @example
 * ```typescript
 * const files = {
 *   'file1.txt': new TextEncoder().encode('content1'),
 *   'file2.txt': new TextEncoder().encode('content2'),
 * };
 * const zip = createZipFromFiles(files);
 * ```
 */
export function createZipFromFiles(
  files: Record<string, Uint8Array>,
  options: ZipCreationOptions = {}
): Uint8Array {
  const date = options.date ?? new Date();
  const { dosDate, dosTime } = toDosDateTime(date);

  const writer = new ByteWriter();
  const fileEntries: FileEntry[] = [];

  // Phase 1: Local File Header + 파일 데이터 쓰기
  for (const [filename, data] of Object.entries(files)) {
    const entry = createFileEntry(filename, data, dosDate, dosTime);
    fileEntries.push(entry);

    writeLocalFileHeader(writer, entry);
    writer.writeBytes(data);
  }

  // Central Directory 시작 offset 저장
  const centralDirectoryOffset = writer.getBuffer().length;

  // Phase 2: Central Directory Header 쓰기
  for (const entry of fileEntries) {
    writeCentralDirectoryHeader(writer, entry);
  }

  // Central Directory 크기 계산
  const centralDirectorySize = writer.getBuffer().length - centralDirectoryOffset;

  // Phase 3: End of Central Directory Record 쓰기
  writeEndOfCentralDirectory(
    writer,
    fileEntries.length,
    centralDirectorySize,
    centralDirectoryOffset
  );

  return writer.getBuffer();
}

/**
 * 파일 엔트리 정보
 */
interface FileEntry {
  /** 파일명 */
  filename: string;
  /** 파일명 바이트 배열 (UTF-8) */
  filenameBytes: Uint8Array;
  /** 파일 데이터 */
  data: Uint8Array;
  /** CRC-32 체크섬 */
  crc32: number;
  /** DOS 날짜 */
  dosDate: number;
  /** DOS 시간 */
  dosTime: number;
  /** Local File Header 시작 offset */
  localHeaderOffset: number;
}

/**
 * 파일 엔트리 생성
 */
function createFileEntry(
  filename: string,
  data: Uint8Array,
  dosDate: number,
  dosTime: number
): FileEntry {
  const filenameBytes = new TextEncoder().encode(filename);
  const crc32 = calculateCRC32(data);

  return {
    filename,
    filenameBytes,
    data,
    crc32,
    dosDate,
    dosTime,
    localHeaderOffset: 0, // writeLocalFileHeader에서 설정
  };
}

/**
 * Local File Header 쓰기 (30 bytes + 가변 길이)
 *
 * Offset  Size  Content
 * 0       4     Local file header signature (0x04034b50)
 * 4       2     Version needed to extract (10 = 1.0)
 * 6       2     General purpose bit flag (0x0800 = UTF-8)
 * 8       2     Compression method (0 = store)
 * 10      2     Last mod file time (DOS)
 * 12      2     Last mod file date (DOS)
 * 14      4     CRC-32
 * 18      4     Compressed size
 * 22      4     Uncompressed size
 * 26      2     Filename length (n)
 * 28      2     Extra field length (0)
 * 30      n     Filename
 */
function writeLocalFileHeader(writer: ByteWriter, entry: FileEntry): void {
  // Local Header offset 저장 (Central Directory에서 참조)
  entry.localHeaderOffset = writer.getBuffer().length;

  // Signature: 0x04034b50
  writer.writeUint32LE(0x04034b50);

  // Version needed to extract: 10 (1.0)
  writer.writeUint16LE(10);

  // General purpose bit flag: 0x0800 (UTF-8 encoding)
  writer.writeUint16LE(0x0800);

  // Compression method: 0 (store)
  writer.writeUint16LE(0);

  // Last mod file time (DOS)
  writer.writeUint16LE(entry.dosTime);

  // Last mod file date (DOS)
  writer.writeUint16LE(entry.dosDate);

  // CRC-32
  writer.writeUint32LE(entry.crc32);

  // Compressed size (= uncompressed size for store)
  writer.writeUint32LE(entry.data.length);

  // Uncompressed size
  writer.writeUint32LE(entry.data.length);

  // Filename length
  writer.writeUint16LE(entry.filenameBytes.length);

  // Extra field length: 0
  writer.writeUint16LE(0);

  // Filename
  writer.writeBytes(entry.filenameBytes);
}

/**
 * Central Directory Header 쓰기 (46 bytes + 가변 길이)
 *
 * Offset  Size  Content
 * 0       4     Central directory signature (0x02014b50)
 * 4       2     Version made by (10 = 1.0)
 * 6       2     Version needed (10 = 1.0)
 * 8       2     Flag (0x0800 = UTF-8)
 * 10      2     Compression (0)
 * 12      2     Mod time
 * 14      2     Mod date
 * 16      4     CRC-32
 * 20      4     Compressed size
 * 24      4     Uncompressed size
 * 28      2     Filename length (n)
 * 30      2     Extra length (0)
 * 32      2     Comment length (0)
 * 34      2     Disk number start (0)
 * 36      2     Internal attributes (0)
 * 38      4     External attributes (0)
 * 42      4     Local header offset
 * 46      n     Filename
 */
function writeCentralDirectoryHeader(writer: ByteWriter, entry: FileEntry): void {
  // Signature: 0x02014b50
  writer.writeUint32LE(0x02014b50);

  // Version made by: 10 (1.0)
  writer.writeUint16LE(10);

  // Version needed: 10 (1.0)
  writer.writeUint16LE(10);

  // Flag: 0x0800 (UTF-8 encoding)
  writer.writeUint16LE(0x0800);

  // Compression: 0 (store)
  writer.writeUint16LE(0);

  // Mod time
  writer.writeUint16LE(entry.dosTime);

  // Mod date
  writer.writeUint16LE(entry.dosDate);

  // CRC-32
  writer.writeUint32LE(entry.crc32);

  // Compressed size
  writer.writeUint32LE(entry.data.length);

  // Uncompressed size
  writer.writeUint32LE(entry.data.length);

  // Filename length
  writer.writeUint16LE(entry.filenameBytes.length);

  // Extra length: 0
  writer.writeUint16LE(0);

  // Comment length: 0
  writer.writeUint16LE(0);

  // Disk number start: 0
  writer.writeUint16LE(0);

  // Internal attributes: 0
  writer.writeUint16LE(0);

  // External attributes: 0
  writer.writeUint32LE(0);

  // Local header offset
  writer.writeUint32LE(entry.localHeaderOffset);

  // Filename
  writer.writeBytes(entry.filenameBytes);
}

/**
 * End of Central Directory Record 쓰기 (22 bytes)
 *
 * Offset  Size  Content
 * 0       4     EOCD signature (0x06054b50)
 * 4       2     Disk number (0)
 * 6       2     Disk with CD (0)
 * 8       2     Entries on this disk
 * 10      2     Total entries
 * 12      4     CD size
 * 16      4     CD offset
 * 20      2     Comment length (0)
 */
function writeEndOfCentralDirectory(
  writer: ByteWriter,
  totalEntries: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number
): void {
  // Signature: 0x06054b50
  writer.writeUint32LE(0x06054b50);

  // Disk number: 0
  writer.writeUint16LE(0);

  // Disk with CD: 0
  writer.writeUint16LE(0);

  // Entries on this disk
  writer.writeUint16LE(totalEntries);

  // Total entries
  writer.writeUint16LE(totalEntries);

  // CD size
  writer.writeUint32LE(centralDirectorySize);

  // CD offset
  writer.writeUint32LE(centralDirectoryOffset);

  // Comment length: 0
  writer.writeUint16LE(0);
}
