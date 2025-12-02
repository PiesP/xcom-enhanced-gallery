import {
  clamp,
  clamp01,
  clampIndex,
  isGlobalLike,
  isGMUserScriptInfo,
  safeElementCheck,
  safeParseFloat,
  safeParseInt,
  safeTweetId,
  stringWithDefault,
  undefinedToNull,
} from '@shared/utils/types/safety';

describe('Type Safety Helpers', () => {
  describe('clamp', () => {
    it('should clamp values within given range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should use default min=0, max=1', () => {
      expect(clamp(0.5)).toBe(0.5);
      expect(clamp(-0.1)).toBe(0);
      expect(clamp(1.1)).toBe(1);
    });
  });

  describe('clamp01', () => {
    it('should clamp values between 0 and 1', () => {
      expect(clamp01(0.5)).toBe(0.5);
      expect(clamp01(-0.1)).toBe(0);
      expect(clamp01(1.1)).toBe(1);
      expect(clamp01(0)).toBe(0);
      expect(clamp01(1)).toBe(1);
    });
  });

  describe('clampIndex', () => {
    it('should clamp index within array bounds', () => {
      expect(clampIndex(2, 5)).toBe(2);
      expect(clampIndex(-1, 5)).toBe(0);
      expect(clampIndex(10, 5)).toBe(4);
      expect(clampIndex(0, 5)).toBe(0);
      expect(clampIndex(4, 5)).toBe(4);
    });

    it('should return 0 for empty or invalid length', () => {
      expect(clampIndex(2, 0)).toBe(0);
      expect(clampIndex(2, -1)).toBe(0);
    });

    it('should handle non-finite indices', () => {
      expect(clampIndex(NaN, 5)).toBe(0);
      expect(clampIndex(Infinity, 5)).toBe(0);
      expect(clampIndex(-Infinity, 5)).toBe(0);
    });

    it('should floor fractional indices', () => {
      expect(clampIndex(2.7, 5)).toBe(2);
      expect(clampIndex(2.1, 5)).toBe(2);
    });
  });

  describe('safeParseInt', () => {
    it('should parse valid integers', () => {
      expect(safeParseInt('123')).toBe(123);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-10')).toBe(-10);
    });

    it('should handle invalid inputs', () => {
      expect(safeParseInt(undefined)).toBe(0);
      expect(safeParseInt(null)).toBe(0);
      expect(safeParseInt('')).toBe(0);
      expect(safeParseInt('abc')).toBe(0);
    });

    it('should handle custom radix', () => {
      expect(safeParseInt('10', 2)).toBe(2);
      expect(safeParseInt('FF', 16)).toBe(255);
    });
  });

  describe('safeParseFloat', () => {
    it('should parse valid floats', () => {
      expect(safeParseFloat('123.45')).toBe(123.45);
      expect(safeParseFloat('0.0')).toBe(0);
      expect(safeParseFloat('-10.5')).toBe(-10.5);
    });

    it('should handle invalid inputs', () => {
      expect(safeParseFloat(undefined)).toBe(0);
      expect(safeParseFloat(null)).toBe(0);
      expect(safeParseFloat('')).toBe(0);
      expect(safeParseFloat('abc')).toBe(0);
    });
  });

  describe('undefinedToNull', () => {
    it('should convert undefined to null', () => {
      expect(undefinedToNull(undefined)).toBeNull();
    });

    it('should return value if defined', () => {
      expect(undefinedToNull('test')).toBe('test');
      expect(undefinedToNull(123)).toBe(123);
      expect(undefinedToNull(null)).toBeNull();
    });
  });

  describe('stringWithDefault', () => {
    it('should return value if defined', () => {
      expect(stringWithDefault('test')).toBe('test');
    });

    it('should return default value if undefined', () => {
      expect(stringWithDefault(undefined)).toBe('');
      expect(stringWithDefault(undefined, 'default')).toBe('default');
    });
  });

  describe('safeElementCheck', () => {
    it('should return true for valid elements', () => {
      const element = document.createElement('div');
      expect(safeElementCheck(element)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(safeElementCheck(null)).toBe(false);
      expect(safeElementCheck(undefined)).toBe(false);
    });
  });

  describe('safeTweetId', () => {
    it('should return value if valid', () => {
      expect(safeTweetId('12345')).toBe('12345');
    });

    it('should generate ID if value is empty or undefined', () => {
      const id1 = safeTweetId(undefined);
      const id2 = safeTweetId('');
      expect(id1).toMatch(/^generated_/);
      expect(id2).toMatch(/^generated_/);
      expect(id1).not.toBe(id2);
    });

    it('should generate ID if value is whitespace', () => {
      const id = safeTweetId('   ');
      expect(id).toMatch(/^generated_/);
    });

    it('should use crypto.randomUUID if available', () => {
      const originalCrypto = global.crypto;
      const mockRandomUUID = vi.fn().mockReturnValue('uuid-123');

      // Mock crypto
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: mockRandomUUID,
        },
        writable: true,
      });

      expect(safeTweetId('')).toBe('generated_uuid-123');

      // Restore crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
      });
    });

    it('should fallback if crypto.randomUUID throws', () => {
      const originalCrypto = global.crypto;

      // Mock crypto to throw
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => {
            throw new Error('Not supported');
          },
        },
        writable: true,
      });

      const id = safeTweetId('');
      expect(id).toMatch(/^generated_/);
      expect(id).not.toContain('.'); // Ensures substring logic is used

      // Restore crypto
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
      });
    });

    it('should fallback if crypto is undefined', () => {
      const originalCrypto = global.crypto;
      // @ts-expect-error - Testing fallback
      delete global.crypto;

      const id = safeTweetId('');
      expect(id).toMatch(/^generated_\d+_[a-z0-9]+$/);

      const parts = id.split('_');
      // substring(2, 9) produces max 7 chars.
      // If mutated to substring(2), it produces ~11 chars.
      expect(parts[2]?.length).toBeLessThanOrEqual(7);

      global.crypto = originalCrypto;
    });
  });

  describe('isGlobalLike', () => {
    it('should return true for global-like objects', () => {
      const mockGlobal = {
        requestIdleCallback: () => {},
        setTimeout: () => {},
      };
      expect(isGlobalLike(mockGlobal)).toBe(true);
    });

    it('should return true for partial global-like objects', () => {
      expect(isGlobalLike({ requestIdleCallback: () => {} })).toBe(true);
      expect(isGlobalLike({ setTimeout: () => {} })).toBe(true);
    });

    it('should return false for non-global-like objects', () => {
      expect(isGlobalLike({})).toBe(false);
      expect(isGlobalLike({ foo: 'bar' })).toBe(false);
      expect(isGlobalLike(null)).toBe(false);
      expect(isGlobalLike(undefined)).toBe(false);
      expect(isGlobalLike(123)).toBe(false);
      expect(isGlobalLike('string')).toBe(false);
    });
  });

  describe('isGMUserScriptInfo', () => {
    it('should return true if scriptHandler is present', () => {
      expect(isGMUserScriptInfo({ scriptHandler: 'Tampermonkey' })).toBe(true);
    });

    it('should return true if object has keys (fallback)', () => {
      expect(isGMUserScriptInfo({ version: '1.0' })).toBe(true);
    });

    it('should return false for empty objects', () => {
      expect(isGMUserScriptInfo({})).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(isGMUserScriptInfo(null)).toBe(false);
      expect(isGMUserScriptInfo(undefined)).toBe(false);
      expect(isGMUserScriptInfo(123)).toBe(false);
    });
  });
});
