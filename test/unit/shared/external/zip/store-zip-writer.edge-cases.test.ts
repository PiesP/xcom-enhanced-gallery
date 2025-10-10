/**
 * @fileoverview StoreZipWriter 엣지케이스 테스트
 * @description 특수 문자, 큰 파일, 중복 파일명 등 엣지케이스 처리 검증
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

describe('StoreZipWriter - 엣지케이스', () => {
  describe('특수 문자 파일명', () => {
    it('should handle Korean filename', () => {
      const writer = new StoreZipWriter();
      const filename = '한글파일.txt';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      // ZIP 생성 성공
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });

    it('should handle spaces in filename', () => {
      const writer = new StoreZipWriter();
      const filename = 'file with spaces.txt';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });

    it('should handle special characters in filename', () => {
      const writer = new StoreZipWriter();
      const filename = 'file#$%&@!.txt';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });

    it('should handle path separator in filename', () => {
      const writer = new StoreZipWriter();
      const filename = 'folder/subfolder/file.txt';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });

    it('should handle mixed languages in filename', () => {
      const writer = new StoreZipWriter();
      const filename = 'image이미지画像.jpg';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });
  });

  describe('파일 크기', () => {
    it('should handle empty file', () => {
      const writer = new StoreZipWriter();
      const filename = 'empty.txt';
      const data = new Uint8Array([]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      // 빈 파일도 정상 처리
      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);

      // 파일 크기는 0
      // Local File Header의 uncompressed size (offset 22-25)
      const size = readUint32LE(zipBytes, 22);
      expect(size).toBe(0);
    });

    it('should handle large file (1MB)', () => {
      const writer = new StoreZipWriter();
      const filename = 'large.bin';
      const data = new Uint8Array(1024 * 1024); // 1MB
      data.fill(0xff);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(1024 * 1024);
    });

    it('should handle multiple large files', () => {
      const writer = new StoreZipWriter();

      // 3개의 큰 파일 추가 (각 512KB)
      for (let i = 0; i < 3; i++) {
        const data = new Uint8Array(512 * 1024);
        data.fill(i);
        writer.addFile(`large${i}.bin`, data);
      }

      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(512 * 1024 * 3);

      // EOCD에서 파일 수 확인
      const eocdOffset = zipBytes.length - 22;
      const fileCount = readUint16LE(zipBytes, eocdOffset + 10);
      expect(fileCount).toBe(3);
    });
  });

  describe('중복 및 특이 파일명', () => {
    it('should allow duplicate filenames', () => {
      const writer = new StoreZipWriter();

      // 동일한 파일명으로 여러 파일 추가
      writer.addFile('duplicate.txt', new Uint8Array([1]));
      writer.addFile('duplicate.txt', new Uint8Array([2, 3]));

      const zipBytes = writer.build();

      // ZIP 생성은 성공 (중복 허용)
      expect(zipBytes).toBeInstanceOf(Uint8Array);

      const eocdOffset = zipBytes.length - 22;
      const fileCount = readUint16LE(zipBytes, eocdOffset + 10);
      expect(fileCount).toBe(2);
    });

    it('should handle very long filename', () => {
      const writer = new StoreZipWriter();
      const filename = 'a'.repeat(200) + '.txt'; // 200자 + 확장자
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });

    it('should handle filename with dots', () => {
      const writer = new StoreZipWriter();
      const filename = 'file.with.many.dots.txt';
      const data = new Uint8Array([1, 2, 3]);

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);
      expect(zipBytes.length).toBeGreaterThan(22);
    });
  });

  describe('데이터 무결성', () => {
    it('should preserve binary data exactly', () => {
      const writer = new StoreZipWriter();
      const filename = 'binary.bin';

      // 다양한 바이트 값을 포함하는 데이터
      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        data[i] = i;
      }

      writer.addFile(filename, data);
      const zipBytes = writer.build();

      // Local File Header + filename 이후 데이터 시작
      const filenameLength = filename.length;
      const dataOffset = 30 + filenameLength;

      // 데이터가 정확히 보존되는지 확인
      ensureRange(zipBytes, dataOffset, data.length);
      const dataSlice = zipBytes.slice(dataOffset, dataOffset + data.length);
      expect(Array.from(dataSlice)).toEqual(Array.from(data));
    });

    it('should calculate correct CRC-32 for various data', () => {
      const writer = new StoreZipWriter();

      // 알려진 CRC-32 값
      const testCases = [
        { data: new Uint8Array([]), expected: 0x00000000 },
        { data: new Uint8Array([0xff]), expected: 0xff000000 },
        { data: new Uint8Array([0x00, 0x00, 0x00, 0x00]), expected: 0x2144df1c },
      ];

      testCases.forEach(({ data, expected }, index) => {
        writer.clear();
        writer.addFile(`test${index}.bin`, data);
        const zipBytes = writer.build();

        // Local File Header의 CRC-32 (offset 14-17)
        const crc = readUint32LE(zipBytes, 14);

        expect(crc).toBe(expected);
      });
    });
  });

  describe('스트레스 테스트', () => {
    it('should handle many files (100+)', () => {
      const writer = new StoreZipWriter();

      // 100개의 파일 추가
      for (let i = 0; i < 100; i++) {
        const data = new Uint8Array([i % 256]);
        writer.addFile(`file${i}.txt`, data);
      }

      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);

      // EOCD에서 파일 수 확인
      const eocdOffset = zipBytes.length - 22;
      const fileCount = readUint16LE(zipBytes, eocdOffset + 10);
      expect(fileCount).toBe(100);
    });

    it('should handle files with identical content but different names', () => {
      const writer = new StoreZipWriter();
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      // 같은 내용이지만 다른 이름
      writer.addFile('copy1.txt', data);
      writer.addFile('copy2.txt', data);
      writer.addFile('copy3.txt', data);

      const zipBytes = writer.build();

      expect(zipBytes).toBeInstanceOf(Uint8Array);

      const eocdOffset = zipBytes.length - 22;
      const fileCount = readUint16LE(zipBytes, eocdOffset + 10);
      expect(fileCount).toBe(3);
    });
  });

  describe('빌드 및 클리어 동작', () => {
    it('should allow multiple builds without clear', () => {
      const writer = new StoreZipWriter();
      writer.addFile('test.txt', new Uint8Array([1, 2, 3]));

      const zip1 = writer.build();
      const zip2 = writer.build();

      // 동일한 ZIP 생성
      expect(zip1.length).toBe(zip2.length);
      expect(zip1).toEqual(zip2);
    });

    it('should allow rebuild after clear', () => {
      const writer = new StoreZipWriter();
      writer.addFile('file1.txt', new Uint8Array([1, 2, 3]));

      const zip1 = writer.build();

      writer.clear();
      writer.addFile('file2.txt', new Uint8Array([4, 5, 6]));

      const zip2 = writer.build();

      // 다른 ZIP 생성
      expect(zip1).not.toEqual(zip2);
    });

    it('should produce valid empty ZIP after clear', () => {
      const writer = new StoreZipWriter();
      writer.addFile('test.txt', new Uint8Array([1, 2, 3]));
      writer.clear();

      const zipBytes = writer.build();

      // 빈 ZIP (EOCD만)
      expect(zipBytes.length).toBe(22);

      // EOCD 시그니처
      expect(zipBytes[0]).toBe(0x50);
      expect(zipBytes[1]).toBe(0x4b);
      expect(zipBytes[2]).toBe(0x05);
      expect(zipBytes[3]).toBe(0x06);
    });
  });
});
