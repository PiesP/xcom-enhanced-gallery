/**
 * ZIP Creator Utility Unit Tests
 */

import { ZipCreator } from '@shared/utils/zip/zip-creator';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock logger
vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fflate
const mockZip = vi.fn();
const mockStrToU8 = vi.fn();

vi.mock('@shared/utils/vendors/index', () => ({
  getFflate: () => ({
    zip: mockZip,
    strToU8: mockStrToU8,
  }),
}));

// Mock Blob
class MockBlob {
  chunks: any;
  options: any;
  size: number;
  type: string;

  constructor(chunks: any, options: any) {
    this.chunks = chunks;
    this.options = options;
    this.size = chunks[0]?.byteLength || 1024;
    this.type = options?.type || '';
  }

  async arrayBuffer() {
    if (this.chunks && this.chunks[0]) {
      return this.chunks[0];
    }
    return new ArrayBuffer(1024);
  }
}

global.Blob = MockBlob as any;

// Mock fetch
global.fetch = vi.fn();

describe('ZipCreator', () => {
  let zipCreator: ZipCreator;

  beforeEach(() => {
    vi.clearAllMocks();
    zipCreator = new ZipCreator();

    // Default mock implementations
    mockStrToU8.mockImplementation((str: string) => new Uint8Array(Buffer.from(str)));
    mockZip.mockImplementation((files: any, callback: Function) => {
      // Simulate successful compression
      const mockCompressedData = new Uint8Array([80, 75, 3, 4]); // ZIP header
      callback(null, mockCompressedData);
    });
  });

  afterEach(() => {
    zipCreator.destroy();
  });

  describe('File Management', () => {
    it('should add a file', () => {
      const fileData = new Uint8Array([1, 2, 3, 4]);
      const result = zipCreator.addFile('test.txt', fileData);

      expect(result).toBe(true);
      expect(zipCreator.getFileCount()).toBe(1);
    });

    it('should add a text file', () => {
      zipCreator.addTextFile('readme.txt', 'Hello World');

      expect(zipCreator.getFileCount()).toBe(1);
      expect(mockStrToU8).toHaveBeenCalledWith('Hello World');
    });

    it('should add an image file', async () => {
      const mockImageData = new Uint8Array([255, 216, 255, 224]); // JPEG header
      const result = await zipCreator.addImageFile('image.jpg', mockImageData);

      expect(result).toBe(true);
      expect(zipCreator.getFileCount()).toBe(1);
    });
    it('should handle file from URL', async () => {
      // JPEG 헤더를 포함한 실제 데이터
      const jpegHeader = new Uint8Array([255, 216, 255, 224]); // JPEG signature
      const mockArrayBuffer = jpegHeader.buffer;

      // Mock Blob을 실제 Blob처럼 보이게 만들기
      const mockBlob = Object.create(Blob.prototype);
      mockBlob.arrayBuffer = vi.fn().mockResolvedValue(mockArrayBuffer);
      mockBlob.type = 'image/jpeg';
      mockBlob.size = jpegHeader.length;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      const result = await zipCreator.addFileFromUrl('image.jpg', 'https://example.com/image.jpg');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg');
    });

    it('should handle URL download failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await zipCreator.addFileFromUrl(
        'notfound.jpg',
        'https://example.com/notfound.jpg'
      );
      expect(result).toBe(false);
    });

    it('should remove files', () => {
      const fileData = new Uint8Array([1, 2, 3]);
      zipCreator.addFile('test.txt', fileData);
      expect(zipCreator.getFileCount()).toBe(1);

      const removed = zipCreator.removeFile('test.txt');
      expect(removed).toBe(true);
      expect(zipCreator.getFileCount()).toBe(0);
    });

    it('should clear all files', () => {
      zipCreator.addFile('file1.txt', new Uint8Array([1]));
      zipCreator.addFile('file2.txt', new Uint8Array([2]));
      expect(zipCreator.getFileCount()).toBe(2);

      zipCreator.clear();
      expect(zipCreator.getFileCount()).toBe(0);
    });
  });

  describe('ZIP Generation', () => {
    it('should create a ZIP file', async () => {
      zipCreator.addTextFile('test.txt', 'Hello World');

      const zipBlob = await zipCreator.createZip();
      expect(zipBlob).toBeInstanceOf(Object);
      expect(mockZip).toHaveBeenCalled();
    });

    it('should create empty ZIP file', async () => {
      const zipBlob = await zipCreator.createZip();
      expect(zipBlob).toBeInstanceOf(Object);
    });

    it('should handle ZIP creation failure', async () => {
      mockZip.mockImplementation((files: any, callback: Function) => {
        callback(new Error('Compression failed'), null);
      });

      zipCreator.addTextFile('test.txt', 'Hello World');

      await expect(zipCreator.createZip()).rejects.toThrow('Compression failed');
    });
  });

  describe('Validation', () => {
    it('should validate filenames', () => {
      const validFile = new Uint8Array([1, 2, 3]);

      expect(() => zipCreator.addFile('valid-file.txt', validFile)).not.toThrow();
      expect(() => zipCreator.addFile('invalid/file?.txt', validFile)).toThrow();
    });

    it('should check file existence', () => {
      const fileData = new Uint8Array([1, 2, 3]);
      zipCreator.addFile('test.txt', fileData);

      expect(zipCreator.hasFile('test.txt')).toBe(true);
      expect(zipCreator.hasFile('nonexistent.txt')).toBe(false);
    });

    it('should get file list', () => {
      zipCreator.addFile('file1.txt', new Uint8Array([1]));
      zipCreator.addFile('file2.txt', new Uint8Array([2]));

      const fileList = zipCreator.getFileList();
      expect(fileList).toContain('file1.txt');
      expect(fileList).toContain('file2.txt');
      expect(fileList).toHaveLength(2);
    });
  });

  describe('Size Management', () => {
    it('should calculate uncompressed size', () => {
      zipCreator.addFile('file1.txt', new Uint8Array([1, 2, 3]));
      zipCreator.addFile('file2.txt', new Uint8Array([4, 5]));

      expect(zipCreator.getUncompressedSize()).toBe(5);
    });

    it('should estimate ZIP size', () => {
      zipCreator.addFile('file1.txt', new Uint8Array([1, 2, 3]));

      const estimate = zipCreator.getEstimatedSize();
      expect(estimate).toBeGreaterThan(0);
    });
  });
});
