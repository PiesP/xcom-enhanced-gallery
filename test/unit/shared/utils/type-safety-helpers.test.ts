/**
 * @fileoverview Type Safety Helpers Tests
 * @description Comprehensive tests for shared/utils/type-safety-helpers.ts
 * Coverage target: 90%+
 */

import { describe, it, expect, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  safeParseInt,
  safeParseFloat,
  undefinedToNull,
  stringWithDefault,
  safeElementCheck,
  safeTweetId,
  createEventListener,
  isGlobalLike,
  isGMUserScriptInfo,
} from '../../../../src/shared/utils/type-safety-helpers';

describe('type-safety-helpers', () => {
  setupGlobalTestIsolation();

  describe('safeParseInt', () => {
    it('should parse valid integer strings', () => {
      expect(safeParseInt('42')).toBe(42);
      expect(safeParseInt('0')).toBe(0);
      expect(safeParseInt('-10')).toBe(-10);
      expect(safeParseInt('100')).toBe(100);
    });

    it('should handle different radix values', () => {
      expect(safeParseInt('10', 2)).toBe(2); // binary
      expect(safeParseInt('FF', 16)).toBe(255); // hex
      expect(safeParseInt('77', 8)).toBe(63); // octal
    });

    it('should return 0 for undefined', () => {
      expect(safeParseInt(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(safeParseInt(null)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(safeParseInt('')).toBe(0);
    });

    it('should return 0 for invalid strings', () => {
      expect(safeParseInt('abc')).toBe(0);
      expect(safeParseInt('not a number')).toBe(0);
    });

    it('should handle strings with leading/trailing numbers', () => {
      expect(safeParseInt('42px')).toBe(42);
      expect(safeParseInt('  123  ')).toBe(123);
    });

    it('should use default radix 10', () => {
      expect(safeParseInt('10')).toBe(10);
      expect(safeParseInt('08')).toBe(8);
    });
  });

  describe('safeParseFloat', () => {
    it('should parse valid float strings', () => {
      expect(safeParseFloat('3.14')).toBe(3.14);
      expect(safeParseFloat('0.5')).toBe(0.5);
      expect(safeParseFloat('-2.71')).toBe(-2.71);
    });

    it('should parse integer strings as floats', () => {
      expect(safeParseFloat('42')).toBe(42);
      expect(safeParseFloat('0')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(safeParseFloat(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(safeParseFloat(null)).toBe(0);
    });

    it('should return 0 for empty string', () => {
      expect(safeParseFloat('')).toBe(0);
    });

    it('should return 0 for invalid strings', () => {
      expect(safeParseFloat('abc')).toBe(0);
      expect(safeParseFloat('not a number')).toBe(0);
    });

    it('should handle scientific notation', () => {
      expect(safeParseFloat('1e3')).toBe(1000);
      expect(safeParseFloat('1.5e2')).toBe(150);
    });

    it('should handle strings with units', () => {
      expect(safeParseFloat('3.14px')).toBe(3.14);
      expect(safeParseFloat('50%')).toBe(50);
    });
  });

  describe('undefinedToNull', () => {
    it('should convert undefined to null', () => {
      expect(undefinedToNull(undefined)).toBe(null);
    });

    it('should preserve non-undefined values', () => {
      expect(undefinedToNull('hello')).toBe('hello');
      expect(undefinedToNull(42)).toBe(42);
      expect(undefinedToNull(0)).toBe(0);
      expect(undefinedToNull(false)).toBe(false);
      expect(undefinedToNull('')).toBe('');
    });

    it('should preserve null', () => {
      expect(undefinedToNull(null)).toBe(null);
    });

    it('should preserve objects', () => {
      const obj = { key: 'value' };
      expect(undefinedToNull(obj)).toBe(obj);
    });

    it('should preserve arrays', () => {
      const arr = [1, 2, 3];
      expect(undefinedToNull(arr)).toBe(arr);
    });
  });

  describe('stringWithDefault', () => {
    it('should return value if defined', () => {
      expect(stringWithDefault('hello')).toBe('hello');
      expect(stringWithDefault('test', 'default')).toBe('test');
    });

    it('should return empty string for undefined by default', () => {
      expect(stringWithDefault(undefined)).toBe('');
    });

    it('should use custom default value', () => {
      expect(stringWithDefault(undefined, 'fallback')).toBe('fallback');
      expect(stringWithDefault(undefined, 'custom')).toBe('custom');
    });

    it('should preserve empty string', () => {
      expect(stringWithDefault('')).toBe('');
      expect(stringWithDefault('', 'default')).toBe('');
    });

    it('should preserve whitespace strings', () => {
      expect(stringWithDefault('  ')).toBe('  ');
      expect(stringWithDefault('\n')).toBe('\n');
    });
  });

  describe('safeElementCheck', () => {
    it('should return true for valid elements', () => {
      const div = document.createElement('div');
      expect(safeElementCheck(div)).toBe(true);
    });

    it('should return false for null', () => {
      expect(safeElementCheck(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(safeElementCheck(undefined)).toBe(false);
    });

    it('should work with different element types', () => {
      const span = document.createElement('span');
      const img = document.createElement('img');
      const button = document.createElement('button');

      expect(safeElementCheck(span)).toBe(true);
      expect(safeElementCheck(img)).toBe(true);
      expect(safeElementCheck(button)).toBe(true);
    });

    it('should work as type guard', () => {
      const element: HTMLElement | undefined = document.createElement('div');

      if (safeElementCheck(element)) {
        // TypeScript should infer element as HTMLElement here
        expect(element.tagName).toBeDefined();
      }
    });
  });

  describe('safeTweetId', () => {
    it('should return value if valid', () => {
      expect(safeTweetId('1234567890')).toBe('1234567890');
      expect(safeTweetId('tweet_123')).toBe('tweet_123');
    });

    it('should generate ID for undefined', () => {
      const id = safeTweetId(undefined);
      expect(id).toContain('generated_');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate ID for empty string', () => {
      const id = safeTweetId('');
      expect(id).toContain('generated_');
    });

    it('should generate ID for whitespace string', () => {
      const id = safeTweetId('   ');
      expect(id).toContain('generated_');
    });

    it('should use crypto.randomUUID if available', () => {
      const mockCrypto = {
        randomUUID: vi.fn().mockReturnValue('mock-uuid-1234'),
      };

      // Mock globalThis.crypto
      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true,
      });

      const id = safeTweetId(undefined);
      expect(id).toBe('generated_mock-uuid-1234');
      expect(mockCrypto.randomUUID).toHaveBeenCalled();

      // Restore
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('should fallback to timestamp+random if crypto fails', () => {
      const mockCrypto = {
        randomUUID: vi.fn().mockImplementation(() => {
          throw new Error('crypto not available');
        }),
      };

      const originalCrypto = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', {
        value: mockCrypto,
        writable: true,
        configurable: true,
      });

      const id = safeTweetId(undefined);
      expect(id).toMatch(/^generated_\d+_[a-z0-9]+$/);

      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true,
      });
    });

    it('should generate unique IDs', () => {
      const id1 = safeTweetId(undefined);
      const id2 = safeTweetId(undefined);
      expect(id1).not.toBe(id2);
    });
  });

  describe('createEventListener', () => {
    it('should wrap event handler', () => {
      const handler = vi.fn((event: Event) => {
        expect(event).toBeDefined();
      });

      const listener = createEventListener(handler);
      expect(typeof listener).toBe('function');
    });

    it('should be compatible with addEventListener', () => {
      const handler = vi.fn();
      const listener = createEventListener(handler);

      const button = document.createElement('button');
      button.addEventListener('click', listener);

      button.click();
      expect(handler).toHaveBeenCalled();
    });

    it('should preserve event type in handler', () => {
      const handler = vi.fn((event: MouseEvent) => {
        expect(event.type).toBe('click');
      });

      const listener = createEventListener(handler);
      const button = document.createElement('button');
      button.addEventListener('click', listener);

      button.click();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('isGlobalLike', () => {
    it('should return true for objects with requestIdleCallback', () => {
      const obj = { requestIdleCallback: () => {} };
      expect(isGlobalLike(obj)).toBe(true);
    });

    it('should return true for objects with setTimeout', () => {
      const obj = { setTimeout: () => {} };
      expect(isGlobalLike(obj)).toBe(true);
    });

    it('should return true for globalThis', () => {
      expect(isGlobalLike(globalThis)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isGlobalLike(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isGlobalLike('string')).toBe(false);
      expect(isGlobalLike(42)).toBe(false);
      expect(isGlobalLike(true)).toBe(false);
      expect(isGlobalLike(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isGlobalLike({})).toBe(false);
    });

    it('should return false for objects without global methods', () => {
      const obj = { someMethod: () => {} };
      expect(isGlobalLike(obj)).toBe(false);
    });
  });

  describe('isGMUserScriptInfo', () => {
    it('should return true for objects with scriptHandler', () => {
      const obj = { scriptHandler: 'Tampermonkey' };
      expect(isGMUserScriptInfo(obj)).toBe(true);
    });

    it('should return true for non-empty objects', () => {
      const obj = { version: '1.0', script: {} };
      expect(isGMUserScriptInfo(obj)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isGMUserScriptInfo(null)).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isGMUserScriptInfo('string')).toBe(false);
      expect(isGMUserScriptInfo(42)).toBe(false);
      expect(isGMUserScriptInfo(true)).toBe(false);
      expect(isGMUserScriptInfo(undefined)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isGMUserScriptInfo({})).toBe(false);
    });

    it('should accept GM_info-like structures', () => {
      const gmInfo = {
        scriptHandler: 'Tampermonkey',
        version: '4.18',
        script: {
          name: 'Test Script',
          version: '1.0',
        },
      };
      expect(isGMUserScriptInfo(gmInfo)).toBe(true);
    });
  });
});
