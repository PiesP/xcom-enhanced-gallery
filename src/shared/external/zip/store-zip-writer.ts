/**
 * @fileoverview STORE 방식(무압축) ZIP 파일 생성기
 * @description fflate 의존성 제거를 위한 경량 ZIP Writer 구현
 * @version 1.0.0
 *
 * ZIP 포맷 명세: PKZIP Application Note (APPNOTE.TXT) 기반
 * 지원 기능: STORE 방식(압축 없음)만 지원
 * 제약 사항: ZIP64, 암호화, 멀티 디스크 미지원
 */

/**
 * ZIP 내부 파일 엔트리
 */
interface FileEntry {
  filename: string;
  data: Uint8Array;
  crc32: number;
  offset: number;
  modTime: number;
  modDate: number;
}

/**
 * STORE 방식(무압축) ZIP 파일 생성기
 *
 * @example
 * ```typescript
 * const writer = new StoreZipWriter();
 * writer.addFile('image1.jpg', imageData);
 * writer.addFile('image2.jpg', imageData2);
 * const zipBytes = writer.build();
 * ```
 */
export class StoreZipWriter {
  private files: FileEntry[] = [];
  private currentOffset: number = 0;

  /**
   * ZIP에 파일 추가
   *
   * @param filename - 파일명 (UTF-8, 경로 구분자 '/' 사용)
   * @param data - 파일 내용 (Uint8Array)
   * @throws {Error} 파일명이 비어있을 경우
   */
  addFile(filename: string, data: Uint8Array): void {
    if (filename?.length === 0) {
      throw new Error('Filename cannot be empty');
    }

    const encoder = new TextEncoder();
    const filenameBytes = encoder.encode(filename);
    const crc32 = calculateCRC32(data);
    const now = new Date();
    const [modTime, modDate] = toDOSDateTime(now);

    this.files.push({
      filename,
      data,
      crc32,
      offset: this.currentOffset,
      modTime,
      modDate,
    });

    // 다음 파일의 오프셋 계산
    // Local File Header (30) + filename length + data length
    this.currentOffset += 30 + filenameBytes.length + data.length;
  }

  /**
   * ZIP 파일을 Uint8Array로 빌드
   *
   * @returns ZIP 파일 바이트 배열
   */
  build(): Uint8Array {
    const totalSize = this.calculateTotalSize();
    const buffer = new Uint8Array(totalSize);
    let offset = 0;

    // 1. Write Local File Headers and File Data
    for (const file of this.files) {
      offset = this.writeLocalFileHeader(buffer, offset, file);
      offset = this.writeFileData(buffer, offset, file);
    }

    // 2. Write Central Directory Headers
    const cdStartOffset = offset;
    for (const file of this.files) {
      offset = this.writeCentralDirectoryHeader(buffer, offset, file);
    }
    const cdSize = offset - cdStartOffset;

    // 3. Write End of Central Directory
    this.writeEndOfCentralDirectory(buffer, offset, this.files.length, cdSize, cdStartOffset);

    return buffer;
  }

  /**
   * 추가된 파일 초기화
   */
  clear(): void {
    this.files = [];
    this.currentOffset = 0;
  }

  /**
   * 전체 ZIP 파일 크기 계산
   */
  private calculateTotalSize(): number {
    let size = 0;
    const encoder = new TextEncoder();

    // Local File Headers + File Data
    for (const file of this.files) {
      const filenameBytes = encoder.encode(file.filename);
      size += 30; // Local File Header 고정 부분
      size += filenameBytes.length; // 파일명
      size += file.data.length; // 파일 데이터
    }

    // Central Directory Headers
    for (const file of this.files) {
      const filenameBytes = encoder.encode(file.filename);
      size += 46; // Central Directory Header 고정 부분
      size += filenameBytes.length; // 파일명
    }

    // End of Central Directory
    size += 22;

    return size;
  }

  /**
   * Local File Header 작성
   */
  private writeLocalFileHeader(buffer: Uint8Array, offset: number, file: FileEntry): number {
    const encoder = new TextEncoder();
    const filenameBytes = encoder.encode(file.filename);

    // Local file header signature (0x04034b50)
    writeUint32(buffer, offset, 0x04034b50);
    offset += 4;

    // Version needed to extract (2.0 = 20)
    writeUint16(buffer, offset, 20);
    offset += 2;

    // General purpose bit flag
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Compression method (0 = STORE)
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Last mod file time
    writeUint16(buffer, offset, file.modTime);
    offset += 2;

    // Last mod file date
    writeUint16(buffer, offset, file.modDate);
    offset += 2;

    // CRC-32
    writeUint32(buffer, offset, file.crc32);
    offset += 4;

    // Compressed size (same as uncompressed for STORE)
    writeUint32(buffer, offset, file.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32(buffer, offset, file.data.length);
    offset += 4;

    // File name length
    writeUint16(buffer, offset, filenameBytes.length);
    offset += 2;

    // Extra field length
    writeUint16(buffer, offset, 0);
    offset += 2;

    // File name
    buffer.set(filenameBytes, offset);
    offset += filenameBytes.length;

    return offset;
  }

  /**
   * File Data 작성
   */
  private writeFileData(buffer: Uint8Array, offset: number, file: FileEntry): number {
    buffer.set(file.data, offset);
    return offset + file.data.length;
  }

  /**
   * Central Directory Header 작성
   */
  private writeCentralDirectoryHeader(buffer: Uint8Array, offset: number, file: FileEntry): number {
    const encoder = new TextEncoder();
    const filenameBytes = encoder.encode(file.filename);

    // Central directory file header signature (0x02014b50)
    writeUint32(buffer, offset, 0x02014b50);
    offset += 4;

    // Version made by (2.0 = 20)
    writeUint16(buffer, offset, 20);
    offset += 2;

    // Version needed to extract (2.0 = 20)
    writeUint16(buffer, offset, 20);
    offset += 2;

    // General purpose bit flag
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Compression method (0 = STORE)
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Last mod file time
    writeUint16(buffer, offset, file.modTime);
    offset += 2;

    // Last mod file date
    writeUint16(buffer, offset, file.modDate);
    offset += 2;

    // CRC-32
    writeUint32(buffer, offset, file.crc32);
    offset += 4;

    // Compressed size
    writeUint32(buffer, offset, file.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32(buffer, offset, file.data.length);
    offset += 4;

    // File name length
    writeUint16(buffer, offset, filenameBytes.length);
    offset += 2;

    // Extra field length
    writeUint16(buffer, offset, 0);
    offset += 2;

    // File comment length
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Disk number start
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Internal file attributes
    writeUint16(buffer, offset, 0);
    offset += 2;

    // External file attributes
    writeUint32(buffer, offset, 0);
    offset += 4;

    // Relative offset of local header
    writeUint32(buffer, offset, file.offset);
    offset += 4;

    // File name
    buffer.set(filenameBytes, offset);
    offset += filenameBytes.length;

    return offset;
  }

  /**
   * End of Central Directory 작성
   */
  private writeEndOfCentralDirectory(
    buffer: Uint8Array,
    offset: number,
    fileCount: number,
    cdSize: number,
    cdOffset: number
  ): void {
    // End of central directory signature (0x06054b50)
    writeUint32(buffer, offset, 0x06054b50);
    offset += 4;

    // Number of this disk
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Disk where central directory starts
    writeUint16(buffer, offset, 0);
    offset += 2;

    // Number of central directory records on this disk
    writeUint16(buffer, offset, fileCount);
    offset += 2;

    // Total number of central directory records
    writeUint16(buffer, offset, fileCount);
    offset += 2;

    // Size of central directory
    writeUint32(buffer, offset, cdSize);
    offset += 4;

    // Offset of start of central directory
    writeUint32(buffer, offset, cdOffset);
    offset += 4;

    // ZIP file comment length
    writeUint16(buffer, offset, 0);
  }
}

/**
 * CRC-32 체크섬 계산
 *
 * @param data - 체크섬을 계산할 데이터
 * @returns CRC-32 값
 */
function calculateCRC32(data: Uint8Array): number {
  const table = makeCRC32Table();
  let crc = 0xffffffff;

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    if (byte !== undefined) {
      crc = (crc >>> 8) ^ (table[(crc ^ byte) & 0xff] ?? 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * CRC-32 테이블 생성
 */
function makeCRC32Table(): Uint32Array {
  const table = new Uint32Array(256);
  const polynomial = 0xedb88320;

  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ polynomial : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }

  return table;
}

/**
 * DOS 날짜/시간 형식으로 변환
 *
 * @param date - JavaScript Date 객체
 * @returns [dosTime, dosDate] 튜플
 */
function toDOSDateTime(date: Date): [number, number] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2); // 2초 단위

  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hours << 11) | (minutes << 5) | seconds;

  return [dosTime, dosDate];
}

/**
 * 16비트 부호 없는 정수 쓰기 (리틀 엔디안)
 *
 * @param buffer - 대상 버퍼
 * @param offset - 쓰기 시작 위치
 * @param value - 쓸 값
 */
function writeUint16(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
}

/**
 * 32비트 부호 없는 정수 쓰기 (리틀 엔디안)
 *
 * @param buffer - 대상 버퍼
 * @param offset - 쓰기 시작 위치
 * @param value - 쓸 값
 */
function writeUint32(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xff;
  buffer[offset + 1] = (value >>> 8) & 0xff;
  buffer[offset + 2] = (value >>> 16) & 0xff;
  buffer[offset + 3] = (value >>> 24) & 0xff;
}
