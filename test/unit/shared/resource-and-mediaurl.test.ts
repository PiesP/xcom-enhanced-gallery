import { describe, it, expect } from 'vitest';
import { ResourceManager } from '@shared/utils/memory/ResourceManager';
import { extractOriginalImageUrl } from '@shared/utils/media/media-url.util';

describe('ResourceManager basic operations', () => {
  it('registers and releases resource via instance', () => {
    const rm = new ResourceManager();
    let cleaned = false;
    rm.register('r1', () => {
      cleaned = true;
    });
    expect(rm.getResourceCount()).toBe(1);
    expect(rm.hasResource('r1')).toBe(true);
    const released = rm.release('r1');
    expect(released).toBe(true);
    expect(cleaned).toBe(true);
    expect(rm.getResourceCount()).toBe(0);
  });

  it('releaseAll invokes all cleanups and clears map', () => {
    const rm = new ResourceManager();
    let c1 = false;
    let c2 = false;
    rm.register('a', () => (c1 = true));
    rm.register('b', () => (c2 = true));
    expect(rm.getResourceCount()).toBe(2);
    rm.releaseAll();
    expect(c1).toBe(true);
    expect(c2).toBe(true);
    expect(rm.getResourceCount()).toBe(0);
  });
});

describe('media-url utils', () => {
  it('extractOriginalImageUrl adds name=orig when missing', () => {
    const url = 'https://pbs.twimg.com/media/ABC.jpg?format=jpg&name=small';
    const out = extractOriginalImageUrl(url);
    expect(out.includes('name=orig')).toBe(true);
  });

  it('extractOriginalImageUrl handles non-query urls', () => {
    const url = 'https://pbs.twimg.com/media/ABC.jpg';
    const out = extractOriginalImageUrl(url);
    expect(out.endsWith('?name=orig')).toBe(true);
  });
});
