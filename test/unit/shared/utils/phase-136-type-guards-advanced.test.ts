/**
 * @fileoverview Phase 136: 고급 Type Guard 테스트
 * @description createEventListener, isGlobalLike, isWindowLike, isEventTargetLike 등 검증
 */

import { describe, it, expect } from 'vitest';
import {
  createEventListener,
  isGlobalLike,
  isWindowLike,
  isEventTargetLike,
  hasAllMethods,
  hasAllProperties,
  isCallable,
} from '@shared/utils/type-safety-helpers';

describe('Phase 136: Advanced Type Guards', () => {
  // ========== createEventListener 테스트 ==========

  describe('createEventListener', () => {
    it('should wrap a resize event handler', () => {
      const handler = (event: Event) => {
        expect(event).toBeDefined();
      };

      const listener = createEventListener(handler);

      expect(typeof listener).toBe('function');
      expect(listener).toBeDefined();
    });

    it('should preserve handler function signature', () => {
      const handler = (event: Event) => {
        return true;
      };

      const listener = createEventListener(handler);
      expect(listener).toEqual(expect.any(Function));
    });

    it('should work with wheel events', () => {
      const handler = (event: WheelEvent) => {
        console.log(event.deltaY);
      };

      const listener = createEventListener(handler);
      expect(listener).toBeDefined();
    });

    it('should be assignable to addEventListener', () => {
      const handler = (event: Event) => {
        // no-op
      };

      const listener = createEventListener(handler);

      // 타입 검증: EventListener는 (event: Event) => void 형태
      const isEventListener = typeof listener === 'function';
      expect(isEventListener).toBe(true);
    });
  });

  // ========== isGlobalLike 테스트 ==========

  describe('isGlobalLike', () => {
    it('should return true for globalThis', () => {
      expect(isGlobalLike(globalThis)).toBe(true);
    });

    it('should return true for window (in browser)', () => {
      // JSDOM에서는 window === globalThis
      expect(isGlobalLike(typeof window !== 'undefined' ? window : globalThis)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isGlobalLike(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isGlobalLike(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isGlobalLike(123)).toBe(false);
      expect(isGlobalLike('string')).toBe(false);
      expect(isGlobalLike(true)).toBe(false);
    });

    it('should return false for objects without setTimeout', () => {
      const obj = {
        requestIdleCallback: undefined,
      };
      expect(isGlobalLike(obj)).toBe(false);
    });

    it('should return true for objects with setTimeout', () => {
      const mockGlobal = {
        setTimeout: () => {},
        requestIdleCallback: undefined,
      };
      expect(isGlobalLike(mockGlobal)).toBe(true);
    });

    it('should return true for objects with requestIdleCallback', () => {
      const mockGlobal = {
        requestIdleCallback: () => {},
      };
      expect(isGlobalLike(mockGlobal)).toBe(true);
    });
  });

  // ========== isWindowLike 테스트 ==========

  describe('isWindowLike', () => {
    it('should return true for actual window object', () => {
      if (typeof window !== 'undefined') {
        expect(isWindowLike(window)).toBe(true);
      }
    });

    it('should return false for null', () => {
      expect(isWindowLike(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isWindowLike(123)).toBe(false);
      expect(isWindowLike('string')).toBe(false);
    });

    it('should require addEventListener method', () => {
      const partial = {
        removeEventListener: () => {},
        dispatchEvent: () => {},
      };
      expect(isWindowLike(partial)).toBe(false);
    });

    it('should require removeEventListener method', () => {
      const partial = {
        addEventListener: () => {},
        dispatchEvent: () => {},
      };
      expect(isWindowLike(partial)).toBe(false);
    });

    it('should require dispatchEvent method', () => {
      const partial = {
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      expect(isWindowLike(partial)).toBe(false);
    });

    it('should return true for complete EventTarget mock', () => {
      const mock = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      };
      expect(isWindowLike(mock)).toBe(true);
    });
  });

  // ========== isEventTargetLike 테스트 ==========

  describe('isEventTargetLike', () => {
    it('should return true for EventTarget interface objects', () => {
      const target = {
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      };
      expect(isEventTargetLike(target)).toBe(true);
    });

    it('should return false for incomplete EventTargets', () => {
      const partial = {
        addEventListener: () => {},
        removeEventListener: () => {},
      };
      expect(isEventTargetLike(partial)).toBe(false);
    });

    it('should work with document object', () => {
      if (typeof document !== 'undefined') {
        expect(isEventTargetLike(document)).toBe(true);
      }
    });

    it('should work with HTMLElement', () => {
      if (typeof document !== 'undefined') {
        const div = document.createElement('div');
        expect(isEventTargetLike(div)).toBe(true);
      }
    });
  });

  // ========== hasAllMethods 테스트 ==========

  describe('hasAllMethods', () => {
    it('should return true when all methods exist', () => {
      const obj = {
        foo: () => {},
        bar: () => {},
        baz: () => {},
      };
      expect(hasAllMethods(obj, ['foo', 'bar', 'baz'])).toBe(true);
    });

    it('should return false when a method is missing', () => {
      const obj = {
        foo: () => {},
        bar: () => {},
      };
      expect(hasAllMethods(obj, ['foo', 'bar', 'baz'])).toBe(false);
    });

    it('should return false when method is not a function', () => {
      const obj = {
        foo: () => {},
        bar: 'not a function',
      };
      expect(hasAllMethods(obj, ['foo', 'bar'])).toBe(false);
    });

    it('should return false for null', () => {
      expect(hasAllMethods(null, ['foo'])).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasAllMethods(undefined, ['foo'])).toBe(false);
    });

    it('should return true for empty method list', () => {
      const obj = { foo: 'bar' };
      expect(hasAllMethods(obj, [])).toBe(true);
    });
  });

  // ========== hasAllProperties 테스트 ==========

  describe('hasAllProperties', () => {
    it('should return true when all properties exist', () => {
      const obj = {
        foo: 'value1',
        bar: 'value2',
        baz: undefined,
      };
      expect(hasAllProperties(obj, ['foo', 'bar', 'baz'])).toBe(true);
    });

    it('should return false when a property is missing', () => {
      const obj = {
        foo: 'value1',
        bar: 'value2',
      };
      expect(hasAllProperties(obj, ['foo', 'bar', 'baz'])).toBe(false);
    });

    it('should handle undefined values as present', () => {
      const obj = {
        foo: undefined,
      };
      expect(hasAllProperties(obj, ['foo'])).toBe(true);
    });

    it('should return false for null', () => {
      expect(hasAllProperties(null, ['foo'])).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasAllProperties(undefined, ['foo'])).toBe(false);
    });

    it('should return true for empty property list', () => {
      const obj = { foo: 'bar' };
      expect(hasAllProperties(obj, [])).toBe(true);
    });
  });

  // ========== isCallable 테스트 ==========

  describe('isCallable', () => {
    it('should return true for functions', () => {
      const fn = () => {};
      expect(isCallable(fn)).toBe(true);
    });

    it('should return true for arrow functions', () => {
      const fn = () => 42;
      expect(isCallable(fn)).toBe(true);
    });

    it('should return true for class constructors', () => {
      class Cls {
        // empty
      }
      expect(isCallable(Cls)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isCallable(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isCallable(undefined)).toBe(false);
    });

    it('should return false for strings', () => {
      expect(isCallable('function')).toBe(false);
    });

    it('should return false for objects', () => {
      expect(isCallable({})).toBe(false);
      expect(isCallable({ foo: () => {} })).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isCallable([])).toBe(false);
    });
  });
});
