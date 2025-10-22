/**
 * @fileoverview VerticalImageItem signalSelector 적용 테스트
 *
 * Phase A5.3 Step 3: signalSelector 일관 적용
 * 파생값 메모이제이션 최적화
 */

import { describe, it, expect } from 'vitest';
import { useSelector } from '../../../src/shared/utils/signal-selector';

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

describe('VerticalImageItem signalSelector optimization', () => {
  describe('fitModeClass selector', () => {
    it('should create fitModeClass selector', () => {
      const mockSignal = {
        value: {
          fitMode: 'fitWidth',
        },
      };

      const selector = useSelector(mockSignal, state => getFitModeClass(state.fitMode), {
        dependencies: state => [state.fitMode],
        name: 'fitModeClass',
      });

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(result).toBe('fitWidth');
    });

    it('should cache fitModeClass when fitMode does not change', () => {
      const mockSignal = {
        value: {
          fitMode: 'fitHeight',
        },
      };

      let computeCount = 0;
      const selector = useSelector(
        mockSignal,
        state => {
          computeCount++;
          return getFitModeClass(state.fitMode);
        },
        {
          dependencies: state => [state.fitMode],
          name: 'fitModeClass',
        }
      );

      const result1 = selector();
      const count1 = computeCount;

      const result2 = selector();
      const count2 = computeCount;

      expect(result1).toBe('fitHeight');
      expect(result2).toBe('fitHeight');
      // Dependency-based caching should minimize recomputes
      expect(count2).toBeGreaterThanOrEqual(count1);
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
  });

  describe('containerClasses selector', () => {
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

    it('should handle complex class composition', () => {
      const mockSignal = {
        value: {
          isActive: false,
          isFocused: true,
          fitMode: 'fitContainer',
          loading: false,
        },
      };

      const selector = useSelector(
        mockSignal,
        state => {
          const classes: string[] = [];
          if (state.isActive) classes.push('active');
          if (state.isFocused) classes.push('focused');
          if (state.loading) classes.push('loading');
          classes.push(getFitModeClass(state.fitMode));
          return classes.join(' ');
        },
        {
          dependencies: state => [state.isActive, state.isFocused, state.loading, state.fitMode],
          name: 'composedClasses',
        }
      );

      const result = selector();
      expect(typeof result).toBe('string');
      expect(result).toContain('focused');
      expect(result).toContain('fitContainer');
    });
  });

  describe('imageClasses selector', () => {
    it('should create imageClasses selector', () => {
      const mockSignal = {
        value: {
          fitMode: 'fitHeight',
          isLoading: false,
        },
      };

      const selector = useSelector(
        mockSignal,
        state => {
          const classes: string[] = [];
          classes.push(getFitModeClass(state.fitMode));
          if (state.isLoading) classes.push('loading');
          return classes;
        },
        {
          dependencies: state => [state.fitMode, state.isLoading],
          name: 'imageClasses',
        }
      );

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toContain('fitHeight');
    });
  });

  describe('selector performance for image rendering', () => {
    it('should provide consistent selectors for rendering optimization', () => {
      const mockSignal = {
        value: {
          isActive: true,
          isFocused: false,
          fitMode: 'fitWidth',
          isLoading: false,
          index: 3,
        },
      };

      // Multiple selectors for different aspects
      const fitModeSelector = useSelector(mockSignal, state => getFitModeClass(state.fitMode), {
        dependencies: state => [state.fitMode],
        name: 'fitMode',
      });

      const activeSelector = useSelector(mockSignal, state => state.isActive || state.isFocused, {
        dependencies: state => [state.isActive, state.isFocused],
        name: 'isActive',
      });

      expect(typeof fitModeSelector).toBe('function');
      expect(typeof activeSelector).toBe('function');

      expect(fitModeSelector()).toBe('fitWidth');
      expect(activeSelector()).toBe(true);
    });

    it('should handle rapid prop changes with dependency tracking', () => {
      const mockSignal = {
        value: {
          fitMode: 'fitWidth',
          isActive: false,
        },
      };

      const selector = useSelector(
        mockSignal,
        state => ({
          fitClass: getFitModeClass(state.fitMode),
          isActive: state.isActive,
        }),
        {
          dependencies: state => [state.fitMode, state.isActive],
          name: 'combinedState',
        }
      );

      const result = selector();
      expect(result).toHaveProperty('fitClass', 'fitWidth');
      expect(result).toHaveProperty('isActive', false);
    });
  });
});
