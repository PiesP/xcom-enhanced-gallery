/**
 * @fileoverview StoreZipWriter 단위 테스트
 * @description STORE 방식(무압축) ZIP 생성기 테스트
 */

import { describe, it, expect } from 'vitest';
import { StoreZipWriter } from '@/shared/external/zip/store-zip-writer';

const ensureRange = (buffer: Uint8Array, offset: number, byteLength: number): void => {
  if (offset < 0 || offset + byteLength > buffer.length) {
    throw new Error(
      `Buffer 범위를 벗어났습니다. offset=${offset}, size=${byteLength}, length=${buffer.length}`
    );
  }
};

const getByte = (buffer: Uint8Array, offset: number): number => {
  ensureRange(buffer, offset, 1);
  return buffer[offset]!;
};

const readUint16LE = (buffer: Uint8Array, offset: number): number => {
  ensureRange(buffer, offset, 2);
  const low = buffer[offset]!;
  const high = buffer[offset + 1]!;
  return low | (high << 8);
};

const readUint32LE = (buffer: Uint8Array, offset: number): number => {
  ensureRange(buffer, offset, 4);
  return (
    (buffer[offset]! |
      (buffer[offset + 1]! << 8) |
      (buffer[offset + 2]! << 16) |
      (buffer[offset + 3]! << 24)) >>>
    0
  );
};

describe('StoreZipWriter', () => {
  describe('빈 ZIP 생성', () => {
    it('should create empty ZIP with only EOCD', () => {
      const writer = new StoreZipWriter();
      const zipBytes = writer.build();

      // 빈 ZIP은 EOCD만 포함 (22 bytes)
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBe(22);

      // EOCD 시그니처 검증 (0x06054b50)
      expect(getByte(zipBytes, 0)).toBe(0x50);
      expect(getByte(zipBytes, 1)).toBe(0x4b);
      expect(getByte(zipBytes, 2)).toBe(0x05);
      expect(getByte(zipBytes, 3)).toBe(0x06);

      // 파일 수는 0
      expect(getByte(zipBytes, 8)).toBe(0);
      expect(getByte(zipBytes, 9)).toBe(0);
      expect(getByte(zipBytes, 10)).toBe(0);
      expect(getByte(zipBytes, 11)).toBe(0);
    });
  });

  describe('단일 파일 추가', () => {
    it('should add single file and build valid ZIP', () => {
      const writer = new StoreZipWriter();
      const fileData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const filename = 'test.txt';

      writer.addFile(filename, fileData);
      const zipBytes = writer.build();

      // ZIP 파일 크기 검증
      // Local File Header (30) + filename (8) + data (5)
      // + Central Directory Header (46) + filename (8)
      // + EOCD (22)
      // = 119 bytes
      expect(zipBytes.length).toBe(119);

      // Local File Header 시그니처 검증 (0x04034b50)
      expect(getByte(zipBytes, 0)).toBe(0x50);
      expect(getByte(zipBytes, 1)).toBe(0x4b);
      expect(getByte(zipBytes, 2)).toBe(0x03);
      expect(getByte(zipBytes, 3)).toBe(0x04);

      // Compression method는 0 (STORE)
      expect(getByte(zipBytes, 8)).toBe(0);
      expect(getByte(zipBytes, 9)).toBe(0);

      // 파일명 길이 검증
      expect(getByte(zipBytes, 26)).toBe(filename.length);
      expect(getByte(zipBytes, 27)).toBe(0);
    });

    it('should calculate CRC-32 correctly', () => {
      const writer = new StoreZipWriter();
      const fileData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"

      writer.addFile('test.txt', fileData);
      const zipBytes = writer.build();

      // "Hello"의 CRC-32는 0xf7d18982
      // Local File Header의 CRC-32 위치 (offset 14-17)
      const crc = readUint32LE(zipBytes, 14);

      expect(crc).toBe(0xf7d18982);
    });

    it('should encode filename as UTF-8', () => {
      const writer = new StoreZipWriter();
      const fileData = new Uint8Array([1, 2, 3]);
      const filename = 'test.txt';

      writer.addFile(filename, fileData);
      const zipBytes = writer.build();

      // Local File Header 이후 파일명 검증
      ensureRange(zipBytes, 30, filename.length);
      const filenameBytes = zipBytes.slice(30, 30 + filename.length);
      // eslint-disable-next-line no-undef
      const decoder = new TextDecoder('utf-8');
      const decodedName = decoder.decode(filenameBytes);

      expect(decodedName).toBe(filename);
    });
  });

  describe('여러 파일 추가', () => {
    it('should add multiple files and build valid ZIP', () => {
      const writer = new StoreZipWriter();

      writer.addFile('file1.txt', new Uint8Array([1, 2, 3]));
      writer.addFile('file2.txt', new Uint8Array([4, 5, 6, 7]));

      const zipBytes = writer.build();

      // ZIP 파일 구조 검증
      expect(zipBytes.length).toBeGreaterThan(0);

      // EOCD에서 파일 수 검증 (마지막 22바이트)
      const eocdOffset = zipBytes.length - 22;
      const fileCount = readUint16LE(zipBytes, eocdOffset + 10);

      expect(fileCount).toBe(2);
    });

    it('should maintain correct offsets for multiple files', () => {
      const writer = new StoreZipWriter();

      writer.addFile('a.txt', new Uint8Array([1]));
      writer.addFile('b.txt', new Uint8Array([2, 3]));

      const zipBytes = writer.build();

      // 첫 번째 파일의 Local File Header 시그니처
      expect(getByte(zipBytes, 0)).toBe(0x50);
      expect(getByte(zipBytes, 1)).toBe(0x4b);
      expect(getByte(zipBytes, 2)).toBe(0x03);
      expect(getByte(zipBytes, 3)).toBe(0x04);

      // 두 번째 파일의 Local File Header는 첫 번째 파일 다음에 위치
      // 30 (header) + 5 (filename) + 1 (data) = 36
      expect(getByte(zipBytes, 36)).toBe(0x50);
      expect(getByte(zipBytes, 37)).toBe(0x4b);
      expect(getByte(zipBytes, 38)).toBe(0x03);
      expect(getByte(zipBytes, 39)).toBe(0x04);
    });
  });

  describe('Central Directory 검증', () => {
    it('should create valid Central Directory headers', () => {
      const writer = new StoreZipWriter();
      writer.addFile('test.txt', new Uint8Array([1, 2, 3]));

      const zipBytes = writer.build();

      // Local File Header + data 이후 Central Directory 위치
      // 30 (header) + 8 (filename) + 3 (data) = 41
      const cdOffset = 41;

      // Central Directory Header 시그니처 (0x02014b50)
      expect(getByte(zipBytes, cdOffset)).toBe(0x50);
      expect(getByte(zipBytes, cdOffset + 1)).toBe(0x4b);
      expect(getByte(zipBytes, cdOffset + 2)).toBe(0x01);
      expect(getByte(zipBytes, cdOffset + 3)).toBe(0x02);

      // Compression method는 0 (STORE)
      expect(getByte(zipBytes, cdOffset + 10)).toBe(0);
      expect(getByte(zipBytes, cdOffset + 11)).toBe(0);
    });

    it('should set correct local header offset in Central Directory', () => {
      const writer = new StoreZipWriter();
      writer.addFile('first.txt', new Uint8Array([1, 2]));
      writer.addFile('second.txt', new Uint8Array([3, 4, 5]));

      const zipBytes = writer.build();

      // 첫 번째 파일의 CD는 모든 local file 이후
      // first: 30 + 9 + 2 = 41
      // second: 30 + 10 + 3 = 43
      // 총 84 bytes 후 Central Directory 시작

      const cdOffset = 84;

      // 첫 번째 CD의 local header offset (offset 42-45, 리틀 엔디안)
      const firstOffset = readUint32LE(zipBytes, cdOffset + 42);

      expect(firstOffset).toBe(0); // 첫 번째 파일은 offset 0
    });
  });

  describe('EOCD 검증', () => {
    it('should set correct file count in EOCD', () => {
      const writer = new StoreZipWriter();
      writer.addFile('a.txt', new Uint8Array([1]));
      writer.addFile('b.txt', new Uint8Array([2]));
      writer.addFile('c.txt', new Uint8Array([3]));

      const zipBytes = writer.build();

      const eocdOffset = zipBytes.length - 22;

      // 이 디스크의 파일 수
      const diskFiles = readUint16LE(zipBytes, eocdOffset + 8);
      expect(diskFiles).toBe(3);

      // 전체 파일 수
      const totalFiles = readUint16LE(zipBytes, eocdOffset + 10);
      expect(totalFiles).toBe(3);
    });

    it('should calculate Central Directory size correctly', () => {
      const writer = new StoreZipWriter();
      writer.addFile('test.txt', new Uint8Array([1, 2, 3]));

      const zipBytes = writer.build();

      const eocdOffset = zipBytes.length - 22;

      // Central Directory 크기 (offset 12-15)
      const cdSize = readUint32LE(zipBytes, eocdOffset + 12);

      // CD Header (46) + filename (8) = 54
      expect(cdSize).toBe(54);
    });

    it('should set correct Central Directory offset in EOCD', () => {
      const writer = new StoreZipWriter();
      writer.addFile('file.txt', new Uint8Array([1, 2, 3, 4]));

      const zipBytes = writer.build();

      const eocdOffset = zipBytes.length - 22;

      // Central Directory 시작 오프셋 (offset 16-19)
      const cdOffset = readUint32LE(zipBytes, eocdOffset + 16);

      // Local File Header (30) + filename (8) + data (4) = 42
      expect(cdOffset).toBe(42);
    });
  });

  describe('clear 메서드', () => {
    it('should clear all added files', () => {
      const writer = new StoreZipWriter();
      writer.addFile('test.txt', new Uint8Array([1, 2, 3]));

      writer.clear();

      const zipBytes = writer.build();

      // 빈 ZIP (EOCD만)
      expect(zipBytes.length).toBe(22);
    });
  });

  describe('에러 처리', () => {
    it('should handle empty filename', () => {
      const writer = new StoreZipWriter();

      expect(() => {
        writer.addFile('', new Uint8Array([1, 2, 3]));
      }).toThrow();
    });

    it('should handle empty data', () => {
      const writer = new StoreZipWriter();
      writer.addFile('empty.txt', new Uint8Array([]));

      const zipBytes = writer.build();

      // 빈 파일도 정상 처리
      expect(zipBytes.length).toBeGreaterThan(22);
    });
  });
});
