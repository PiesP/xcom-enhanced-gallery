/**
 * @fileoverview Reactive Accessor Utilities 테스트
 * @description SolidJS MaybeAccessor 패턴 공용 헬퍼 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { getSolidCore } from '@shared/external/vendors';

// RED: 구현 전이므로 import 실패 예상
import {
  resolve,
  resolveWithDefault,
  combineAccessors,
  type ReactiveValue,
} from '@shared/utils/reactive-accessor';

describe('Reactive Accessor Utilities', () => {
  describe('resolve', () => {
    it('should return primitive value as-is', () => {
      expect(resolve(42)).toBe(42);
      expect(resolve('hello')).toBe('hello');
      expect(resolve(true)).toBe(true);
      expect(resolve(null)).toBe(null);
    });

    it('should call accessor function and return its result', () => {
      const accessor = () => 100;
      expect(resolve(accessor)).toBe(100);
    });

    it('should handle accessor returning different types', () => {
      expect(resolve(() => 'string')).toBe('string');
      expect(resolve(() => 123)).toBe(123);
      expect(resolve(() => ({ key: 'value' }))).toEqual({ key: 'value' });
    });

    it('should preserve type safety', () => {
      const numValue: ReactiveValue<number> = 42;
      const numAccessor: ReactiveValue<number> = () => 100;

      const result1: number = resolve(numValue);
      const result2: number = resolve(numAccessor);

      expect(result1).toBe(42);
      expect(result2).toBe(100);
    });
  });

  describe('resolveWithDefault', () => {
    it('should return resolved value when not null/undefined', () => {
      expect(resolveWithDefault(42, 0)).toBe(42);
      expect(resolveWithDefault('text', 'default')).toBe('text');
      expect(resolveWithDefault(() => 100, 0)).toBe(100);
    });

    it('should return default value when resolved is null', () => {
      expect(resolveWithDefault(null, 99)).toBe(99);
      expect(resolveWithDefault(() => null, 99)).toBe(99);
    });

    it('should return default value when resolved is undefined', () => {
      expect(resolveWithDefault(undefined, 99)).toBe(99);
      expect(resolveWithDefault(() => undefined, 99)).toBe(99);
    });

    it('should handle false and 0 as valid values', () => {
      expect(resolveWithDefault(false, true)).toBe(false);
      expect(resolveWithDefault(0, 100)).toBe(0);
      expect(resolveWithDefault('', 'default')).toBe('');
    });
  });

  describe('combineAccessors', () => {
    it('should resolve array of primitive values', () => {
      const result = combineAccessors([1, 2, 3]);
      expect(result()).toEqual([1, 2, 3]);
    });

    it('should resolve array of accessor functions', () => {
      const result = combineAccessors([() => 1, () => 2, () => 3]);
      expect(result()).toEqual([1, 2, 3]);
    });

    it('should resolve mixed array of values and accessors', () => {
      const result = combineAccessors([1, () => 2, 3, () => 4]);
      expect(result()).toEqual([1, 2, 3, 4]);
    });

    it('should return memoized accessor', () => {
      const solid = getSolidCore();
      const { createSignal } = solid;

      const [count, setCount] = createSignal(1);
      const result = combineAccessors([count, () => 2]);

      expect(result()).toEqual([1, 2]);

      setCount(10);
      expect(result()).toEqual([10, 2]);
    });

    it('should handle empty array', () => {
      const result = combineAccessors([]);
      expect(result()).toEqual([]);
    });
  });
});
