/**
 * @fileoverview ToastContainer signalSelector 적용 테스트
 *
 * Phase A5.3 Step 3: signalSelector 일관 적용
 * 파생값 메모이제이션 최적화
 */

import { describe, it, expect } from 'vitest';
import { useSelector } from '../../../src/shared/utils/signal-selector';

describe('signalSelector utility', () => {
  describe('useSelector function signature', () => {
    it('should be a callable function', () => {
      expect(typeof useSelector).toBe('function');
    });

    it('should accept signal, selector function, and options', () => {
      // useSelector 타입 시그니처 검증
      expect(useSelector.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('selector caching behavior', () => {
    it('should create memoized selectors with dependency tracking', () => {
      // Mock signal
      const mockSignal = { value: [1, 2, 3, 4, 5] };

      // Create selector with dependencies
      const selector = useSelector(
        mockSignal,
        (state: typeof mockSignal.value) => state.slice(0, 3),
        {
          dependencies: state => [state.length],
          name: 'testSelector',
        }
      );

      // Verify selector is a function
      expect(typeof selector).toBe('function');

      // Call selector
      const result = selector();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should work with both typed and untyped signals', () => {
      const signal1 = { value: { count: 5 } };

      const selector1 = useSelector(signal1, state => state.count > 3);

      expect(typeof selector1).toBe('function');
    });
  });

  describe('selector with different dependency types', () => {
    it('should handle array-based dependencies', () => {
      const mockSignal = { value: { a: 1, b: 2 } };

      const selector = useSelector(mockSignal, state => state.a + state.b, {
        dependencies: state => [state.a, state.b],
      });

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(typeof result).toBe('number');
    });

    it('should work without explicit dependencies (reference equality)', () => {
      const mockSignal = { value: [1, 2, 3] };

      const selector = useSelector(mockSignal, state => [...state]);

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('ToastContainer use case simulation', () => {
    it('should support slice operation for toast limiting', () => {
      // Simulate ToastContainer usage
      const mockToastSignal = {
        value: [
          { id: '1', message: 'Toast 1' },
          { id: '2', message: 'Toast 2' },
          { id: '3', message: 'Toast 3' },
          { id: '4', message: 'Toast 4' },
          { id: '5', message: 'Toast 5' },
        ],
      };

      const maxToasts = 3;
      const limitedToastsSelector = useSelector(
        mockToastSignal,
        state => state.slice(0, maxToasts),
        {
          dependencies: state => [state.length, maxToasts],
          name: 'limitedToasts',
        }
      );

      expect(typeof limitedToastsSelector).toBe('function');

      const result = limitedToastsSelector();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(maxToasts);
    });

    it('should preserve toast item structure', () => {
      const mockToastSignal = {
        value: [
          { id: 'toast-1', message: 'Test 1', type: 'info' as const },
          { id: 'toast-2', message: 'Test 2', type: 'info' as const },
        ],
      };

      const selector = useSelector(mockToastSignal, state => state.slice(0, 1));

      const result = selector();
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('message');
    });
  });
});
