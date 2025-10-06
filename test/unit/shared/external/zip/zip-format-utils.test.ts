/**
 * @fileoverview Tests for ZIP format utilities (CRC32, DOS datetime, ByteWriter)
 * @description Phase 1.1 - Store-only ZIP implementation utilities
 */

/* eslint-disable no-undef */
import { describe, it, expect } from 'vitest';

describe('ZIP Format Utilities', () => {
  describe('calculateCRC32', () => {
    it('should calculate CRC32 for "hello world"', async () => {
      const { calculateCRC32 } = await import('@shared/external/zip/zip-format-utils');
      const encoder = new TextEncoder();
      const data = encoder.encode('hello world');
      const crc = calculateCRC32(data);

      // Standard CRC32 for "hello world" is 0x0D4A1185
      expect(crc).toBe(0x0d4a1185);
    });

    it('should calculate CRC32 for empty data', async () => {
      const { calculateCRC32 } = await import('@shared/external/zip/zip-format-utils');
      const data = new Uint8Array(0);
      const crc = calculateCRC32(data);

      // CRC32 of empty string is 0
      expect(crc).toBe(0);
    });

    it('should calculate CRC32 for single byte', async () => {
      const { calculateCRC32 } = await import('@shared/external/zip/zip-format-utils');
      const data = new Uint8Array([65]); // 'A'
      const crc = calculateCRC32(data);

      expect(crc).toBe(0xd3d99e8b);
    });

    it('should handle binary data', async () => {
      const { calculateCRC32 } = await import('@shared/external/zip/zip-format-utils');
      const data = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
      const crc = calculateCRC32(data);

      expect(typeof crc).toBe('number');
      expect(crc).toBeGreaterThanOrEqual(0);
      expect(crc).toBeLessThanOrEqual(0xffffffff);
    });
  });

  describe('toDosDateTime', () => {
    it('should convert Date to DOS format', async () => {
      const { toDosDateTime } = await import('@shared/external/zip/zip-format-utils');
      const date = new Date('2025-10-06T14:30:00');
      const { dosDate, dosTime } = toDosDateTime(date);

      // DOS date: ((year-1980) << 9) | (month << 5) | day
      // 2025-1980=45, month=10, day=6
      // (45 << 9) | (10 << 5) | 6 = 23040 + 320 + 6 = 23366
      expect(dosDate).toBe(23366);

      // DOS time: (hour << 11) | (minute << 5) | (second/2)
      // hour=14, minute=30, second=0
      // (14 << 11) | (30 << 5) | 0 = 28672 + 960 + 0 = 29632
      expect(dosTime).toBe(29632);
    });

    it('should handle start of DOS era (1980-01-01)', async () => {
      const { toDosDateTime } = await import('@shared/external/zip/zip-format-utils');
      const date = new Date('1980-01-01T00:00:00');
      const { dosDate, dosTime } = toDosDateTime(date);

      // ((1980-1980) << 9) | (1 << 5) | 1 = 0 + 32 + 1 = 33
      expect(dosDate).toBe(33);
      expect(dosTime).toBe(0);
    });

    it('should handle year 2107 (max DOS year)', async () => {
      const { toDosDateTime } = await import('@shared/external/zip/zip-format-utils');
      const date = new Date('2107-12-31T23:59:58');
      const { dosDate, dosTime } = toDosDateTime(date);

      // ((2107-1980) << 9) | (12 << 5) | 31 = 65024 + 384 + 31 = 65439
      expect(dosDate).toBe(65439);
      // (23 << 11) | (59 << 5) | (58/2) = 47104 + 1888 + 29 = 49021
      expect(dosTime).toBe(49021);
    });

    it('should handle odd seconds (round down)', async () => {
      const { toDosDateTime } = await import('@shared/external/zip/zip-format-utils');
      const date = new Date('2025-10-06T12:00:01'); // 1 second
      const { dosTime } = toDosDateTime(date);

      // second/2 = 1/2 = 0 (integer division)
      // (12 << 11) | (0 << 5) | 0 = 24576
      expect(dosTime).toBe(24576);
    });
  });

  describe('ByteWriter', () => {
    it('should write uint8', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeUint8(0x42);
      writer.writeUint8(0xff);

      const buffer = writer.getBuffer();
      expect(buffer).toEqual(new Uint8Array([0x42, 0xff]));
    });

    it('should write uint16 little-endian', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeUint16LE(0x1234);

      const buffer = writer.getBuffer();
      // Little-endian: LSB first
      expect(buffer).toEqual(new Uint8Array([0x34, 0x12]));
    });

    it('should write uint32 little-endian', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeUint32LE(0x12345678);

      const buffer = writer.getBuffer();
      expect(buffer).toEqual(new Uint8Array([0x78, 0x56, 0x34, 0x12]));
    });

    it('should write bytes', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      const data = new Uint8Array([1, 2, 3, 4]);
      writer.writeBytes(data);

      const buffer = writer.getBuffer();
      expect(buffer).toEqual(data);
    });

    it('should concatenate multiple writes', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeUint8(0x01);
      writer.writeUint16LE(0x0203);
      writer.writeUint32LE(0x04050607);
      writer.writeBytes(new Uint8Array([0x08, 0x09]));

      const buffer = writer.getBuffer();
      expect(buffer).toEqual(
        new Uint8Array([0x01, 0x03, 0x02, 0x07, 0x06, 0x05, 0x04, 0x08, 0x09])
      );
    });

    it('should handle empty writes', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeBytes(new Uint8Array(0));

      const buffer = writer.getBuffer();
      expect(buffer).toEqual(new Uint8Array(0));
    });

    it('should return new buffer each time', async () => {
      const { ByteWriter } = await import('@shared/external/zip/zip-format-utils');
      const writer = new ByteWriter();

      writer.writeUint8(0x42);
      const buffer1 = writer.getBuffer();

      writer.writeUint8(0x43);
      const buffer2 = writer.getBuffer();

      // Should be different buffers
      expect(buffer1).not.toBe(buffer2);
      expect(buffer1).toEqual(new Uint8Array([0x42]));
      expect(buffer2).toEqual(new Uint8Array([0x42, 0x43]));
    });
  });
});
