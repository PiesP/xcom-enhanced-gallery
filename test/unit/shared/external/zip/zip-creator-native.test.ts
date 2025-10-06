/**
 * ZIP 구조 생성 테스트 (Store-only, 압축 없음)
 * @file test/unit/shared/external/zip/zip-creator-native.test.ts
 *
 * ZIP 포맷 사양:
 * - Local File Header + 파일 데이터
 * - Central Directory Header
 * - End of Central Directory Record
 *
 * 참고: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 */

import { describe, it, expect } from 'vitest';

// TextEncoder는 JSDOM 환경에서 전역으로 제공됨
/* eslint-disable no-undef */

describe('createZipFromFiles', () => {
  /**
   * RED 1: 단일 파일 ZIP 생성
   *
   * 예상 구조:
   * - Local File Header (30 + filename length)
   * - File Data
   * - Central Directory Header (46 + filename length)
   * - EOCD (22 bytes)
   */
  it('단일 파일 ZIP을 생성해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {
      'test.txt': new TextEncoder().encode('hello'),
    };

    const zip = createZipFromFiles(files);

    // 기본 검증
    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip.length).toBeGreaterThan(0);

    // ZIP 매직 넘버 검증 (Local File Header signature)
    expect(zip[0]).toBe(0x50); // 'P'
    expect(zip[1]).toBe(0x4b); // 'K'
    expect(zip[2]).toBe(0x03);
    expect(zip[3]).toBe(0x04);
  });

  /**
   * RED 2: 다중 파일 ZIP 생성
   */
  it('다중 파일 ZIP을 생성해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {
      'file1.txt': new TextEncoder().encode('content1'),
      'file2.txt': new TextEncoder().encode('content2'),
      'file3.txt': new TextEncoder().encode('content3'),
    };

    const zip = createZipFromFiles(files);

    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip.length).toBeGreaterThan(0);

    // ZIP 시그니처 존재
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);

    // EOCD에서 파일 수 검증 (offset: EOCD signature 위치에서 +10, +11)
    // EOCD signature: 0x06054b50
    const eocdIndex = findEOCDSignature(zip);
    expect(eocdIndex).toBeGreaterThan(-1);

    const totalEntries = zip[eocdIndex + 10] | (zip[eocdIndex + 11] << 8);
    expect(totalEntries).toBe(3);
  });

  /**
   * RED 3: 빈 파일 처리
   */
  it('빈 파일을 처리할 수 있어야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {
      'empty.txt': new Uint8Array(0),
    };

    expect(() => createZipFromFiles(files)).not.toThrow();

    const zip = createZipFromFiles(files);
    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip[0]).toBe(0x50); // ZIP signature
  });

  /**
   * RED 4: 특수 문자 파일명 (UTF-8)
   */
  it('특수 문자 파일명을 처리할 수 있어야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {
      '한글파일.txt': new TextEncoder().encode('test content'),
      'file with spaces.txt': new TextEncoder().encode('data'),
      'файл.txt': new TextEncoder().encode('russian'),
    };

    expect(() => createZipFromFiles(files)).not.toThrow();

    const zip = createZipFromFiles(files);
    expect(zip).toBeInstanceOf(Uint8Array);
  });

  /**
   * RED 5: Local File Header 구조 검증
   */
  it('Local File Header를 올바르게 생성해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const data = new TextEncoder().encode('hello');
    const files = { 'test.txt': data };

    const zip = createZipFromFiles(files);

    // Local File Header (offset 0)
    // signature: 0x04034b50
    expect(zip[0]).toBe(0x50);
    expect(zip[1]).toBe(0x4b);
    expect(zip[2]).toBe(0x03);
    expect(zip[3]).toBe(0x04);

    // Version needed: 10 (1.0) or 20 (2.0) - little endian
    expect(zip[4]).toBe(10);
    expect(zip[5]).toBe(0);

    // General purpose bit flag: 0 (little endian)
    expect(zip[6]).toBe(0);
    expect(zip[7]).toBe(0);

    // Compression method: 0 (store, little endian)
    expect(zip[8]).toBe(0);
    expect(zip[9]).toBe(0);

    // Compressed/Uncompressed size (offset 18, 22) - little endian
    const compressedSize = zip[18] | (zip[19] << 8) | (zip[20] << 16) | (zip[21] << 24);
    const uncompressedSize = zip[22] | (zip[23] << 8) | (zip[24] << 16) | (zip[25] << 24);

    expect(compressedSize).toBe(data.length);
    expect(uncompressedSize).toBe(data.length);

    // Filename length (offset 26) - little endian
    const filenameLength = zip[26] | (zip[27] << 8);
    expect(filenameLength).toBe('test.txt'.length);

    // Extra field length (offset 28) - should be 0
    const extraLength = zip[28] | (zip[29] << 8);
    expect(extraLength).toBe(0);
  });

  /**
   * RED 6: 파일 데이터 위치 검증
   */
  it('Local File Header 다음에 파일 데이터가 와야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const data = new TextEncoder().encode('hello');
    const files = { 'test.txt': data };

    const zip = createZipFromFiles(files);

    // Local File Header size: 30 + filename length
    const filename = 'test.txt';
    const headerSize = 30 + filename.length;

    // 파일 데이터는 headerSize offset부터 시작
    const fileDataStart = headerSize;
    const fileData = zip.slice(fileDataStart, fileDataStart + data.length);

    // 파일 데이터 검증 (바이트 비교)
    expect(Array.from(fileData)).toEqual(Array.from(data));
    expect(new TextDecoder().decode(fileData)).toBe('hello');
  });

  /**
   * RED 7: Central Directory Header 구조 검증
   */
  it('Central Directory Header를 올바르게 생성해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = { 'test.txt': new TextEncoder().encode('hello') };
    const zip = createZipFromFiles(files);

    // Central Directory signature: 0x02014b50
    // Local File Header + 파일 데이터 이후에 위치
    const cdIndex = findCentralDirectorySignature(zip);
    expect(cdIndex).toBeGreaterThan(-1);

    const cd = zip.slice(cdIndex);

    // Signature
    expect(cd[0]).toBe(0x50);
    expect(cd[1]).toBe(0x4b);
    expect(cd[2]).toBe(0x01);
    expect(cd[3]).toBe(0x02);

    // Compression method (offset 10): 0 (store)
    expect(cd[10]).toBe(0);
    expect(cd[11]).toBe(0);

    // Filename length (offset 28)
    const filenameLength = cd[28] | (cd[29] << 8);
    expect(filenameLength).toBe('test.txt'.length);

    // Local header offset (offset 42) - should be 0 for first file
    const localHeaderOffset = cd[42] | (cd[43] << 8) | (cd[44] << 16) | (cd[45] << 24);
    expect(localHeaderOffset).toBe(0);
  });

  /**
   * RED 8: EOCD 구조 검증
   */
  it('End of Central Directory Record를 올바르게 생성해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = { 'test.txt': new TextEncoder().encode('hello') };
    const zip = createZipFromFiles(files);

    // EOCD signature: 0x06054b50 (ZIP 파일 끝에서 22 bytes 이전)
    const eocdIndex = findEOCDSignature(zip);
    expect(eocdIndex).toBeGreaterThan(-1);

    const eocd = zip.slice(eocdIndex);

    // Signature
    expect(eocd[0]).toBe(0x50);
    expect(eocd[1]).toBe(0x4b);
    expect(eocd[2]).toBe(0x05);
    expect(eocd[3]).toBe(0x06);

    // Disk number (offset 4): 0
    expect(eocd[4]).toBe(0);
    expect(eocd[5]).toBe(0);

    // Disk with CD (offset 6): 0
    expect(eocd[6]).toBe(0);
    expect(eocd[7]).toBe(0);

    // Entries on this disk (offset 8)
    const entriesThisDisk = eocd[8] | (eocd[9] << 8);
    expect(entriesThisDisk).toBe(1);

    // Total entries (offset 10)
    const totalEntries = eocd[10] | (eocd[11] << 8);
    expect(totalEntries).toBe(1);

    // Comment length (offset 20): 0
    expect(eocd[20]).toBe(0);
    expect(eocd[21]).toBe(0);
  });

  /**
   * RED 9: 날짜/시간 옵션 처리
   */
  it('사용자 지정 날짜를 처리할 수 있어야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = { 'test.txt': new TextEncoder().encode('hello') };
    const customDate = new Date('2025-10-06T14:30:00');

    const zip = createZipFromFiles(files, { date: customDate });

    expect(zip).toBeInstanceOf(Uint8Array);
    expect(zip[0]).toBe(0x50); // ZIP signature

    // DOS datetime 검증 (Local File Header offset 10-13)
    const dosTime = zip[10] | (zip[11] << 8);
    const dosDate = zip[12] | (zip[13] << 8);

    // DOS date: (년-1980) << 9 | 월 << 5 | 일
    const expectedDosDate = ((2025 - 1980) << 9) | (10 << 5) | 6;
    expect(dosDate).toBe(expectedDosDate);

    // DOS time: 시 << 11 | 분 << 5 | (초/2)
    const expectedDosTime = (14 << 11) | (30 << 5) | 0;
    expect(dosTime).toBe(expectedDosTime);
  });

  /**
   * RED 10: 큰 파일 처리 (메모리 효율성 기본 검증)
   */
  it('큰 파일을 처리할 수 있어야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    // 1MB 파일 생성
    const largeData = new Uint8Array(1024 * 1024);
    for (let i = 0; i < largeData.length; i++) {
      largeData[i] = i % 256;
    }

    const files = { 'large.bin': largeData };

    expect(() => createZipFromFiles(files)).not.toThrow();

    const zip = createZipFromFiles(files);
    expect(zip).toBeInstanceOf(Uint8Array);

    // 파일 크기 검증 (대략적)
    // ZIP overhead: Local Header (30+filename) + CD (46+filename) + EOCD (22)
    // ≈ 1MB + 100 bytes
    expect(zip.length).toBeGreaterThan(1024 * 1024);
    expect(zip.length).toBeLessThan(1024 * 1024 + 200);
  });

  /**
   * RED 11: 다중 파일 순서 보존
   */
  it('파일 순서를 보존해야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {
      'a.txt': new TextEncoder().encode('first'),
      'b.txt': new TextEncoder().encode('second'),
      'c.txt': new TextEncoder().encode('third'),
    };

    const zip = createZipFromFiles(files);

    // 첫 번째 파일명 검증 (Local File Header offset 30)
    const firstFilename = new TextDecoder().decode(zip.slice(30, 35));
    expect(firstFilename).toBe('a.txt');

    // 다음 Local File Header 찾기
    // 첫 번째 파일: LFH(30+5) + 데이터(5) = 40
    const secondLFHStart = 40;
    expect(zip[secondLFHStart]).toBe(0x50); // LFH signature
    expect(zip[secondLFHStart + 1]).toBe(0x4b);

    const secondFilename = new TextDecoder().decode(
      zip.slice(secondLFHStart + 30, secondLFHStart + 35)
    );
    expect(secondFilename).toBe('b.txt');
  });

  /**
   * RED 12: 빈 파일 객체 처리
   */
  it('빈 파일 객체를 처리할 수 있어야 함', async () => {
    const { createZipFromFiles } = await import('@shared/external/zip/zip-creator-native');

    const files = {};

    expect(() => createZipFromFiles(files)).not.toThrow();

    const zip = createZipFromFiles(files);
    expect(zip).toBeInstanceOf(Uint8Array);

    // 빈 ZIP: CD + EOCD만 존재
    // EOCD만 있으면 최소 22 bytes
    expect(zip.length).toBeGreaterThanOrEqual(22);

    // EOCD 존재 확인
    const eocdIndex = findEOCDSignature(zip);
    expect(eocdIndex).toBeGreaterThan(-1);

    // Total entries: 0
    const totalEntries = zip[eocdIndex + 10] | (zip[eocdIndex + 11] << 8);
    expect(totalEntries).toBe(0);
  });
});

/**
 * 헬퍼: EOCD signature 찾기 (0x06054b50)
 * ZIP 파일 끝에서 역방향 검색 (최대 65KB 댓글 지원)
 */
function findEOCDSignature(data: Uint8Array): number {
  for (let i = data.length - 22; i >= 0 && i >= data.length - 22 - 65535; i--) {
    if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x05 && data[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

/**
 * 헬퍼: Central Directory signature 찾기 (0x02014b50)
 */
function findCentralDirectorySignature(data: Uint8Array): number {
  for (let i = 0; i < data.length - 4; i++) {
    if (data[i] === 0x50 && data[i + 1] === 0x4b && data[i + 2] === 0x01 && data[i + 3] === 0x02) {
      return i;
    }
  }
  return -1;
}
