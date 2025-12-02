import { StreamingZipWriter } from '@shared/external/zip/streaming-zip-writer';
import { encodeUtf8, calculateCRC32 } from '@shared/external/zip/zip-utils';

vi.mock('@shared/logging', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
import { logger } from '@shared/logging';

describe('StreamingZipWriter', () => {
  it('should add a file, finalize and return zip bytes', () => {
    const writer = new StreamingZipWriter();
    const data = encodeUtf8('hello world');
    writer.addFile('hello.txt', data);
    expect(writer.getEntryCount()).toBe(1);
    expect(writer.getCurrentSize()).toBeGreaterThan(0);
    const zipBytes = writer.finalize();
    expect(zipBytes instanceof Uint8Array).toBe(true);
    expect(zipBytes.length).toBeGreaterThan(data.length);
    // Should have logged info about finalize
    expect(logger.info).toHaveBeenCalled();
  });

  it('should store CRCs and central directory offsets correctly', () => {
    const writer = new StreamingZipWriter();
    const file1 = encodeUtf8('abc');
    const file2 = encodeUtf8('1234');
    writer.addFile('a.txt', file1);
    writer.addFile('b.txt', file2);

    const offsetBeforeFinalize = writer.getCurrentSize();
    const zipBytes = writer.finalize();

    // Find local header signatures (PK\x03\x04)
    const sig = [0x50, 0x4b, 0x03, 0x04];
    const indices: number[] = [];
    for (let i = 0; i < zipBytes.length - 3; i++) {
      if (
        zipBytes[i] === sig[0] &&
        zipBytes[i + 1] === sig[1] &&
        zipBytes[i + 2] === sig[2] &&
        zipBytes[i + 3] === sig[3]
      ) {
        indices.push(i);
      }
    }

    // Should have at least two local headers
    expect(indices.length).toBeGreaterThanOrEqual(2);
    const firstIdx = indices[0]!;
    const secondIdx = indices[1]!;

    const crcAtLocal = (index: number) => {
      // CRC is 4 bytes little-endian at offset index + 14
      const base = index + 14;
      if (base + 3 >= zipBytes.length) throw new Error('Local header truncated');
      const dv = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
      return dv.getUint32(base, true);
    };

    expect(crcAtLocal(firstIdx)).toBe(calculateCRC32(file1));
    expect(crcAtLocal(secondIdx)).toBe(calculateCRC32(file2));

    // Read central directory start offset from End of Central Directory record
    // Offset is stored at finalZip.length - 6 (4 bytes little endian)
    if (zipBytes.length < 22) throw new Error('Zip too small');
    const endOffset = zipBytes.length - 6;
    if (endOffset + 3 >= zipBytes.length) throw new Error('End of central directory truncated');
    const dv = new DataView(zipBytes.buffer, zipBytes.byteOffset, zipBytes.byteLength);
    const centralDirStart = dv.getUint32(endOffset, true);

    expect(centralDirStart).toBe(offsetBeforeFinalize);
  });
});
