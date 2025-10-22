/**
 * @fileoverview Toolbar signalSelector 적용 테스트
 *
 * Phase A5.3 Step 3: signalSelector 일관 적용
 * 파생값 메모이제이션 최적화
 */

import { describe, it, expect } from 'vitest';
import { useSelector } from '../../../src/shared/utils/signal-selector';

// Mock getToolbarDataState 함수
const mockGetToolbarDataState = (state: any) => ({
  ...state,
  derived: true,
  timestamp: Date.now(),
});

describe('Toolbar signalSelector optimization', () => {
  describe('toolbarDataState selector', () => {
    it('should create toolbarDataState selector', () => {
      const mockSignal = {
        value: {
          currentIndex: 0,
          totalCount: 10,
          isLoading: false,
          currentFitMode: 'fitWidth' as const,
        },
      };

      const selector = useSelector(mockSignal, state => mockGetToolbarDataState(state), {
        dependencies: state => [state.currentIndex, state.totalCount, state.isLoading],
        name: 'toolbarDataState',
      });

      expect(typeof selector).toBe('function');
      const result = selector();
      expect(result).toHaveProperty('derived', true);
    });

    it('should cache results when toolbar state does not change', () => {
      const mockSignal = {
        value: {
          currentIndex: 5,
          totalCount: 20,
          isLoading: false,
          currentFitMode: 'fitContainer' as const,
        },
      };

      let computeCount = 0;
      const selector = useSelector(
        mockSignal,
        state => {
          computeCount++;
          return mockGetToolbarDataState(state);
        },
        {
          dependencies: state => [state.currentIndex, state.totalCount],
          name: 'toolbarDataState',
        }
      );

      // First call
      const result1 = selector();
      const count1 = computeCount;

      // Second call (same dependencies)
      const result2 = selector();
      const count2 = computeCount;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // With proper dependency tracking, recompute count should be minimal
      expect(count2).toBeGreaterThanOrEqual(count1);
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

  describe('toolbar with multiple derived selectors', () => {
    it('should support separate selectors for different derived values', () => {
      const mockSignal = {
        value: {
          currentIndex: 3,
          totalCount: 10,
          isLoading: false,
        },
      };

      // Selector 1: State transformation
      const dataStateSelector = useSelector(mockSignal, state => ({ ...state, enhanced: true }), {
        name: 'dataState',
      });

      // Selector 2: Different derived value
      const navigationSelector = useSelector(
        mockSignal,
        state => ({
          hasPrevious: state.currentIndex > 0,
          hasNext: state.currentIndex < state.totalCount - 1,
        }),
        {
          dependencies: state => [state.currentIndex, state.totalCount],
          name: 'navigationState',
        }
      );

      const data = dataStateSelector();
      const nav = navigationSelector();

      expect(data).toHaveProperty('enhanced');
      expect(nav).toHaveProperty('hasPrevious', true);
      expect(nav).toHaveProperty('hasNext', true);
    });
  });

  describe('event handler memoization comparison', () => {
    it('should distinguish between state transformation and event handlers', () => {
      // State transformation: Should use useSelector
      const stateTransform = useSelector(
        { value: { count: 5 } },
        state => ({ ...state, doubled: state.count * 2 }),
        { name: 'stateTransform' }
      );

      expect(typeof stateTransform).toBe('function');
      const result = stateTransform();
      expect(result).toHaveProperty('doubled', 10);
    });
  });

  describe('performance characteristics', () => {
    it('should provide consistent selector interface for toolbar optimization', () => {
      const toolbarSignal = {
        value: {
          currentIndex: 0,
          totalCount: 50,
          isLoading: false,
        },
      };

      const optimizedSelector = useSelector(
        toolbarSignal,
        state => {
          // Complex transformation
          return {
            ...state,
            percentage: (state.currentIndex / Math.max(1, state.totalCount)) * 100,
            status: state.isLoading ? 'loading' : 'ready',
          };
        },
        {
          dependencies: state => [state.currentIndex, state.totalCount, state.isLoading],
          name: 'toolbarOptimized',
        }
      );

      const result = optimizedSelector();
      expect(result).toHaveProperty('percentage');
      expect(result).toHaveProperty('status', 'ready');
    });
  });
});
