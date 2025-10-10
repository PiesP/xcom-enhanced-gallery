import { describe, it, expect } from 'vitest';
import { createZipBytesFromFileMap } from '@/shared/external/zip/zip-creator';

describe('zip-creator adapter', () => {
  it('should create non-empty zip bytes from in-memory file map', async () => {
    const files: Record<string, Uint8Array> = {
      'a.txt': new Uint8Array([104, 101, 108, 108, 111]), // 'hello'
      'b.txt': new Uint8Array([119, 111, 114, 108, 100]), // 'world'
    };
    const bytes = await createZipBytesFromFileMap(files);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
