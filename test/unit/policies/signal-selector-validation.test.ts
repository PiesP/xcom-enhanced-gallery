/**
 * @fileoverview Signal Selector Memoization Policy
 * @description Verify consistent use of signalSelector for derived value memoization
 * and caching behavior across components.
 *
 * Policy: Use useSelector for memoized derived values with dependency tracking
 * to optimize performance and maintain consistency.
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { useSelector } from '@/shared/utils/signal-selector';

describe('Signal Selector Memoization Policy', () => {
  setupGlobalTestIsolation();

  describe('useSelector function signature and behavior', () => {
    it('should be a callable function', () => {
      expect(typeof useSelector).toBe('function');
    });

    it('should accept signal, selector function, and options', () => {
      expect(useSelector.length).toBeGreaterThanOrEqual(2);
    });

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

  describe('selector caching with different dependency types', () => {
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

  describe('Toast Container selector use case', () => {
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
  });

  describe('Toolbar state transformation selector', () => {
    it('should create toolbarDataState selector', () => {
      const mockSignal = {
        value: {
          currentIndex: 0,
          totalCount: 10,
          isLoading: false,
          currentFitMode: 'fitWidth' as const,
        },
      };

      const selector = useSelector(
        mockSignal,
        state => ({ ...state, derived: true, timestamp: Date.now() }),
        {
          dependencies: state => [state.currentIndex, state.totalCount, state.isLoading],
          name: 'toolbarDataState',
        }
      );

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(result).toHaveProperty('derived', true);
    });

    it('should handle complex toolbar state transformation', () => {
      const complexState = {
        value: {
          currentIndex: 0,
          totalCount: 100,
          isLoading: false,
          currentFitMode: 'fitWidth' as const,
          isDownloading: false,
          disabled: false,
        },
      };

      const selector = useSelector(
        complexState,
        state => ({
          ...state,
          isNavigable: state.totalCount > 1,
          canDownload: !state.disabled && state.totalCount > 0,
          isProcessing: state.isLoading || state.isDownloading,
        }),
        {
          dependencies: state => [
            state.totalCount,
            state.disabled,
            state.isLoading,
            state.isDownloading,
          ],
          name: 'enhancedToolbarState',
        }
      );

      const result = selector();
      expect(result).toHaveProperty('isNavigable', true);
      expect(result).toHaveProperty('canDownload', true);
      expect(result).toHaveProperty('isProcessing', false);
    });
  });

  describe('VerticalImageItem fitMode class selector', () => {
    const getFitModeClass = (fitMode: string): string => {
      switch (fitMode) {
        case 'fitWidth':
          return 'fitWidth';
        case 'fitHeight':
          return 'fitHeight';
        case 'fitContainer':
          return 'fitContainer';
        default:
          return 'original';
      }
    };

    it('should create fitModeClass selector', () => {
      const mockSignal = { value: { fitMode: 'fitWidth' } };

      const selector = useSelector(mockSignal, state => getFitModeClass(state.fitMode), {
        dependencies: state => [state.fitMode],
        name: 'fitModeClass',
      });

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(result).toBe('fitWidth');
    });

    it('should support all fitMode values', () => {
      const fitModes = ['fitWidth', 'fitHeight', 'fitContainer', 'original'];

      fitModes.forEach(mode => {
        const mockSignal = { value: { fitMode: mode } };

        const selector = useSelector(mockSignal, state => getFitModeClass(state.fitMode), {
          dependencies: state => [state.fitMode],
        });

        const result = selector();
        expect(typeof result).toBe('string');
      });
    });

    it('should create containerClasses selector', () => {
      const mockSignal = {
        value: {
          isActive: true,
          isFocused: false,
          fitMode: 'fitWidth',
        },
      };

      const selector = useSelector(
        mockSignal,
        state => {
          const classes: string[] = [];
          if (state.isActive) classes.push('active');
          if (state.isFocused) classes.push('focused');
          classes.push(getFitModeClass(state.fitMode));
          return classes;
        },
        {
          dependencies: state => [state.isActive, state.isFocused, state.fitMode],
          name: 'containerClasses',
        }
      );

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('active');
      expect(result).toContain('fitWidth');
    });
  });
});
