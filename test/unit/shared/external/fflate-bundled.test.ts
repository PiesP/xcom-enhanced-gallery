import { describe, it, expect } from 'vitest';
import { fflateBundled } from '@/shared/external/fflate-bundled';

describe('fflate-bundled facade', () => {
  it('exports required fflate APIs', () => {
    expect(typeof fflateBundled.zip).toBe('function');
    expect(typeof fflateBundled.unzip).toBe('function');
    expect(typeof fflateBundled.strToU8).toBe('function');
    expect(typeof fflateBundled.strFromU8).toBe('function');
    expect(typeof fflateBundled.zipSync).toBe('function');
    expect(typeof fflateBundled.unzipSync).toBe('function');
    expect(typeof fflateBundled.deflate).toBe('function');
    expect(typeof fflateBundled.inflate).toBe('function');
  });
});
