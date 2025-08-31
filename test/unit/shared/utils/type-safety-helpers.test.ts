import { describe, it, expect } from 'vitest';

import {
  safeParseInt,
  safeParseFloat,
  safeArrayGet,
  safeNodeListAccess,
  safeMatchExtract,
  undefinedToNull,
  nullToUndefined,
  stringWithDefault,
} from '@shared/utils/type-safety-helpers';

describe('type-safety-helpers (pure)', () => {
  it('safeParseInt parses integers and falls back to 0', () => {
    expect(safeParseInt('42')).toBe(42);
    expect(safeParseInt('  7 ')).toBe(7);
    expect(safeParseInt('abc')).toBe(0);
    expect(safeParseInt(null)).toBe(0);
    expect(safeParseInt(undefined)).toBe(0);
  });

  it('safeParseFloat parses floats and falls back to 0', () => {
    expect(safeParseFloat('3.14')).toBeCloseTo(3.14);
    expect(safeParseFloat('0.0')).toBeCloseTo(0);
    expect(safeParseFloat('not-a-number')).toBe(0);
  });

  it('safeArrayGet and safeNodeListAccess return undefined for out-of-bounds or null', () => {
    const arr = ['a', 'b', 'c'];
    expect(safeArrayGet(arr, 1)).toBe('b');
    expect(safeArrayGet(arr, 10)).toBeUndefined();
    expect(safeArrayGet(null, 0)).toBeUndefined();

    // safeNodeListAccess works the same for arrays
    // use actual Node[] for safeNodeListAccess to satisfy TypeScript
    const nodes: any =
      typeof document !== 'undefined'
        ? [document.createTextNode('a'), document.createTextNode('b'), document.createTextNode('c')]
        : (arr as unknown as Node[]);
    expect(safeNodeListAccess(nodes, 2)?.textContent).toBe('c');
    expect(safeNodeListAccess(nodes, -1)).toBeUndefined();
    expect(safeNodeListAccess(undefined, 0)).toBeUndefined();
  });

  it('safeMatchExtract returns matched group or default', () => {
    const match = 'abc123'.match(/([a-z]+)(\d+)/);
    expect(safeMatchExtract(match, 1, null)).toBe('abc');
    expect(safeMatchExtract(match, 2, null)).toBe('123');
    expect(safeMatchExtract(null, 1, 'x')).toBe('x');
  });

  it('undefinedToNull and nullToUndefined and stringWithDefault behave correctly', () => {
    expect(undefinedToNull(undefined)).toBeNull();
    expect(undefinedToNull('ok')).toBe('ok');

    expect(nullToUndefined(null)).toBeUndefined();
    expect(nullToUndefined('ok')).toBe('ok');

    expect(stringWithDefault(undefined, 'def')).toBe('def');
    expect(stringWithDefault('val', 'def')).toBe('val');
  });
});
