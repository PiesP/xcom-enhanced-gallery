/**
 * @fileoverview STORE mode (no-compression) ZIP file writer
 * @description Lightweight ZIP Writer implementation to eliminate fflate dependency (Phase 374)
 *
 * **Purpose**: Create ZIP files with STORE method (no compression) for already-compressed media
 * **Pattern**: Internal implementation (@internal), used by barrel export {@link createZipBytesFromFileMap}
 * **Principle**: PKZIP Application Note (RFC 1951-1952) compliant, no external dependencies
 *
 * **Scope**:
 * - Supported: STORE method (compression method 0)
 * - Not supported: ZIP64, encryption, multi-disk, DEFLATE compression
 *
 * **ZIP File Structure**:
 * 1. Local File Header + File Data (for each file)
 * 2. Central Directory Header (for each file)
 * 3. End of Central Directory Record
 *
 * **Memory Management** (Phase 374):
 * - Buffer pre-allocation: calculateTotalSize() upfront
 * - Offset tracking: currentOffset maintains write position
 * - CRC32 caching: calculateCRC32() uses table lookup (memoized)
 *
 * **Performance**:
 * - No re-compression for pre-compressed media (JPEG, MP4, PNG)
 * - Polynomial 0xedb88320 for CRC32 calculation
 * - DOS DateTime conversion (1980-based) for ZIP compatibility
 *
 * @version 12.0.0 - Phase 374: 100% English, comprehensive JSDoc, @internal marking
 * @internal Implementation detail - access only via barrel export {@link createZipBytesFromFileMap}
 */

import {
  calculateCRC32,
  encodeUtf8,
  writeUint16LEToBuffer,
  writeUint32LEToBuffer,
} from './zip-utils';

/**
 * ZIP internal file entry (local representation)
 *
 * **Fields**:
 * - `filename`: UTF-8 encoded filename (path separator: '/')
 * - `data`: File content bytes (Uint8Array)
 * - `crc32`: CRC-32 checksum (for ZIP integrity)
 * - `offset`: Byte offset where file starts in final ZIP
 * - `modTime`: DOS time format (2-second resolution)
 * - `modDate`: DOS date format (1980-based year)
 *
 * @internal Implementation detail
 */
interface FileEntry {
  filename: string;
  filenameBytes: Uint8Array;
  data: Uint8Array;
  crc32: number;
  offset: number;
  modTime: number;
  modDate: number;
}

/**
 * STORE mode (no-compression) ZIP file writer
 *
 * Sequentially writes ZIP structure:
 * 1. Local File Headers + File Data
 * 2. Central Directory Headers (all files)
 * 3. End of Central Directory Record
 *
 * **STORE Method**: Compression method 0 (no compression)
 * - Ideal for already-compressed media (JPEG, PNG, MP4)
 * - No performance penalty for re-compression
 *
 * **Usage Example**:
 * ```typescript
 * const writer = new StoreZipWriter();
 * writer.addFile('photo1.jpg', jpegBuffer);
 * writer.addFile('video.mp4', videoBuffer);
 * const zipBytes = writer.build();
 * // Download or save zipBytes...
 * ```
 *
 * @internal Implementation detail - use barrel export {@link createZipBytesFromFileMap}
 */
export class StoreZipWriter {
  private files: FileEntry[] = [];
  private currentOffset: number = 0;

  /**
   * Add file to ZIP archive
   *
   * Computes CRC-32 checksum and DOS time/date, tracks byte offset for later reference.
   * Files must be added before calling build().
   *
   * **Filename Rules**:
   * - UTF-8 encoded (no null bytes)
   * - Path separator: forward slash (/)
   * - Cannot be empty
   *
   * @param filename - File name (UTF-8, e.g. 'photos/photo1.jpg')
   * @param data - File content bytes (Uint8Array)
   * @throws {Error} If filename is empty
   *
   * @example
   * ```typescript
   * writer.addFile('images/photo.jpg', jpegBuffer);
   * ```
   *
   * @internal Use {@link createZipBytesFromFileMap} instead
   */
  addFile(filename: string, data: Uint8Array): void {
    if (filename?.length === 0) {
      throw new Error('Filename cannot be empty');
    }

    const filenameBytes = encodeUtf8(filename);
    const crc32 = calculateCRC32(data);
    const now = new Date();
    const [modTime, modDate] = toDOSDateTime(now);

    this.files.push({
      filename,
      filenameBytes,
      data,
      crc32,
      offset: this.currentOffset,
      modTime,
      modDate,
    });

    // Calculate offset for next file
    // Local File Header (30 bytes fixed) + filename length + data length
    this.currentOffset += 30 + filenameBytes.length + data.length;
  }

  /**
   * Build complete ZIP file bytes
   *
   * Assembles all ZIP components in order:
   * 1. Local File Headers with file data
   * 2. Central Directory Headers
   * 3. End of Central Directory Record
   *
   * **Time Complexity**: O(n) where n = number of files
   * **Space Complexity**: O(total_file_size)
   *
   * @returns Complete ZIP file as Uint8Array
   * @throws {Error} If buffer write fails (should not occur with valid input)
   *
   * @internal Use {@link createZipBytesFromFileMap} instead
   */
  build(): Uint8Array {
    const totalSize = this.calculateTotalSize();
    const buffer = new Uint8Array(totalSize);
    let offset = 0;

    // Step 1: Write Local File Headers and File Data
    for (const file of this.files) {
      offset = this.writeLocalFileHeader(buffer, offset, file);
      offset = this.writeFileData(buffer, offset, file);
    }

    // Step 2: Write Central Directory Headers
    const cdStartOffset = offset;
    for (const file of this.files) {
      offset = this.writeCentralDirectoryHeader(buffer, offset, file);
    }
    const cdSize = offset - cdStartOffset;

    // Step 3: Write End of Central Directory
    this.writeEndOfCentralDirectory(buffer, offset, this.files.length, cdSize, cdStartOffset);

    return buffer;
  }

  /**
   * Clear all added files (reset state)
   *
   * Removes all files from the writer, allowing reuse for a new ZIP.
   * Useful when creating multiple ZIP files sequentially.
   *
   * @internal Implementation detail
   */
  clear(): void {
    this.files = [];
    this.currentOffset = 0;
  }

  /**
   * Calculate total size of final ZIP file (pre-allocation)
   *
   * Computes buffer size needed for all ZIP components:
   * - Local File Headers (30 bytes each + filename length)
   * - File data (variable)
   * - Central Directory Headers (46 bytes each + filename length)
   * - End of Central Directory Record (22 bytes)
   *
   * **Purpose**: Pre-allocate exact buffer size to avoid reallocations
   *
   * @returns Total byte count for ZIP file
   * @private Implementation detail
   * @internal
   */
  private calculateTotalSize(): number {
    let size = 0;

    // Local File Headers + File Data
    for (const file of this.files) {
      size += 30; // Local File Header fixed portion
      size += file.filenameBytes.length; // Filename
      size += file.data.length; // File data
    }

    // Central Directory Headers
    for (const file of this.files) {
      size += 46; // Central Directory Header fixed portion
      size += file.filenameBytes.length; // Filename
    }

    // End of Central Directory Record (fixed)
    size += 22;

    return size;
  }

  /**
   * Write Local File Header to buffer
   *
   * **Local File Header Structure** (PKZIP format):
   * - Signature: 0x04034b50
   * - Version: 20 (2.0)
   * - Bit flags: 0 (no encryption/compression)
   * - Compression: 0 (STORE - no compression)
   * - Modification time/date: DOS format
   * - CRC-32: File checksum
   * - Sizes: Compressed and uncompressed (same for STORE)
   * - Filename: UTF-8 encoded
   *
   * @private Implementation detail
   * @internal
   */
  private writeLocalFileHeader(buffer: Uint8Array, offset: number, file: FileEntry): number {
    const { filenameBytes } = file;

    // Local file header signature (0x04034b50)
    writeUint32LEToBuffer(buffer, offset, 0x04034b50);
    offset += 4;

    // Version needed to extract (2.0 = 20)
    writeUint16LEToBuffer(buffer, offset, 20);
    offset += 2;

    // General purpose bit flag (no special features)
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Compression method (0 = STORE, no compression)
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Last mod file time (DOS format)
    writeUint16LEToBuffer(buffer, offset, file.modTime);
    offset += 2;

    // Last mod file date (DOS format)
    writeUint16LEToBuffer(buffer, offset, file.modDate);
    offset += 2;

    // CRC-32 checksum
    writeUint32LEToBuffer(buffer, offset, file.crc32);
    offset += 4;

    // Compressed size (same as uncompressed for STORE)
    writeUint32LEToBuffer(buffer, offset, file.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32LEToBuffer(buffer, offset, file.data.length);
    offset += 4;

    // File name length
    writeUint16LEToBuffer(buffer, offset, filenameBytes.length);
    offset += 2;

    // Extra field length (no extra fields)
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // File name
    buffer.set(filenameBytes, offset);
    offset += filenameBytes.length;

    return offset;
  }

  /**
   * Write file data to buffer
   *
   * @private Implementation detail
   * @internal
   */
  private writeFileData(buffer: Uint8Array, offset: number, file: FileEntry): number {
    buffer.set(file.data, offset);
    return offset + file.data.length;
  }

  /**
   * Write Central Directory Header to buffer
   *
   * **Central Directory Header Structure** (PKZIP format):
   * - Similar to Local File Header
   * - Includes relative offset of Local File Header
   * - Used for ZIP directory listing/verification
   *
   * @private Implementation detail
   * @internal
   */
  private writeCentralDirectoryHeader(buffer: Uint8Array, offset: number, file: FileEntry): number {
    const { filenameBytes } = file;

    // Central directory file header signature (0x02014b50)
    writeUint32LEToBuffer(buffer, offset, 0x02014b50);
    offset += 4;

    // Version made by (2.0 = 20)
    writeUint16LEToBuffer(buffer, offset, 20);
    offset += 2;

    // Version needed to extract (2.0 = 20)
    writeUint16LEToBuffer(buffer, offset, 20);
    offset += 2;

    // General purpose bit flag
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Compression method (0 = STORE)
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Last mod file time
    writeUint16LEToBuffer(buffer, offset, file.modTime);
    offset += 2;

    // Last mod file date
    writeUint16LEToBuffer(buffer, offset, file.modDate);
    offset += 2;

    // CRC-32
    writeUint32LEToBuffer(buffer, offset, file.crc32);
    offset += 4;

    // Compressed size
    writeUint32LEToBuffer(buffer, offset, file.data.length);
    offset += 4;

    // Uncompressed size
    writeUint32LEToBuffer(buffer, offset, file.data.length);
    offset += 4;

    // File name length
    writeUint16LEToBuffer(buffer, offset, filenameBytes.length);
    offset += 2;

    // Extra field length
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // File comment length
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Disk number start
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Internal file attributes
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // External file attributes
    writeUint32LEToBuffer(buffer, offset, 0);
    offset += 4;

    // Relative offset of local header
    writeUint32LEToBuffer(buffer, offset, file.offset);
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
    writeUint32LEToBuffer(buffer, offset, 0x06054b50);
    offset += 4;

    // Number of this disk
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Disk where central directory starts
    writeUint16LEToBuffer(buffer, offset, 0);
    offset += 2;

    // Number of central directory records on this disk
    writeUint16LEToBuffer(buffer, offset, fileCount);
    offset += 2;

    // Total number of central directory records
    writeUint16LEToBuffer(buffer, offset, fileCount);
    offset += 2;

    // Size of central directory
    writeUint32LEToBuffer(buffer, offset, cdSize);
    offset += 4;

    // Offset of start of central directory
    writeUint32LEToBuffer(buffer, offset, cdOffset);
    offset += 4;

    // ZIP file comment length
    writeUint16LEToBuffer(buffer, offset, 0);
  }
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
