import { describe, it, expect } from 'vitest';
import {
  safeParseInt,
  safeParseFloat,
  safeArrayGet,
  safeMatchExtract,
  safeCall,
  safeTweetId,
  safeUsername,
  removeUndefinedProperties,
  undefinedToNull,
  nullToUndefined,
} from '@shared/utils/type-safety-helpers';

describe('type-safety-helpers basics', () => {
  it('safeParseInt and safeParseFloat basic', () => {
    expect(safeParseInt('123')).toBe(123);
    expect(safeParseInt('abc')).toBe(0);
    expect(safeParseInt(null)).toBe(0);
  });

  it('safeParseFloat handles floats and invalid values', () => {
    expect(safeParseFloat('1.23')).toBeCloseTo(1.23);
    expect(safeParseFloat('xyz')).toBe(0);
    expect(safeParseFloat(undefined)).toBe(0);
  });

  it('safeArrayGet returns element or undefined', () => {
    expect(safeArrayGet([1, 2, 3], 1)).toBe(2);
    expect(safeArrayGet([1, 2, 3], 10)).toBeUndefined();
    expect(safeArrayGet(null, 0)).toBeUndefined();
  });

  it('safeMatchExtract returns matched group or default', () => {
    const m = 'a=1'.match(/a=(\d+)/);
    expect(safeMatchExtract(m, 1)).toBe('1');
    expect(safeMatchExtract(null, 1, 'x')).toBe('x');
  });

  it('safeCall and safeTweetId and safeUsername', () => {
    expect(safeCall((a, b) => a + b, 1, 2)).toBe(3);
    const id = safeTweetId(undefined);
    expect(typeof id).toBe('string');
    expect(safeUsername('@bob')).toBe('bob');
    expect(safeUsername('alice')).toBe('alice');
  });

  it('undefinedToNull and nullToUndefined behaviours', () => {
    expect(undefinedToNull(undefined)).toBeNull();
    expect(nullToUndefined(null)).toBeUndefined();
  });

  it('removeUndefinedProperties removes undefined keys', () => {
    const obj = { a: 1, b: undefined, c: 'x' };
    const res = removeUndefinedProperties(obj);
    expect(res).toEqual({ a: 1, c: 'x' });
  });
});
