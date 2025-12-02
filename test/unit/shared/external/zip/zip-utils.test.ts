import {
  encodeUtf8,
  calculateCRC32,
  writeUint16LE,
  writeUint32LE,
} from '@shared/external/zip/zip-utils';

describe('zip-utils', () => {
  it('should encode UTF-8 strings', () => {
    const u = encodeUtf8('hello');
    // Use ArrayBuffer.isView to be robust across different JS realms (jsdom, vm, node)
    expect(ArrayBuffer.isView(u)).toBe(true);
    expect(new TextDecoder().decode(u)).toBe('hello');
  });

  it('should calculate a consistent CRC32', () => {
    const data = encodeUtf8('abc');
    const crc1 = calculateCRC32(data);
    const crc2 = calculateCRC32(data);
    expect(crc1).toBe(crc2);
    expect(typeof crc1).toBe('number');
  });

  it('should write 16-bit and 32-bit little endian values', () => {
    const b16 = writeUint16LE(0x1234);
    expect(b16.length).toBe(2);
    expect(b16[0]).toBe(0x34);
    expect(b16[1]).toBe(0x12);

    const b32 = writeUint32LE(0x12345678);
    expect(b32.length).toBe(4);
    expect(b32[0]).toBe(0x78);
    expect(b32[1]).toBe(0x56);
    expect(b32[2]).toBe(0x34);
    expect(b32[3]).toBe(0x12);
  });
});
