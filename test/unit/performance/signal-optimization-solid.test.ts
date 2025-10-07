/**
 * @fileoverview Performance Optimization Primitives (Solid.js) - Phase 3 TDD
 * @description Solid Primitives 기반 성능 최적화 유틸리티 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';

// Test import (will be implemented)
import {
  createMemoizedSelector,
  createAsyncSelector,
  getGlobalStats,
  resetGlobalStats,
  setDebugMode,
  isDebugMode,
} from '@/shared/utils/performance/signalOptimization-solid';

describe('signalOptimization-solid (Phase 3 TDD)', () => {
  beforeEach(() => {
    resetGlobalStats();
    setDebugMode(false);
  });

  describe('createMemoizedSelector', () => {
    it('should create a memoized selector function', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);
        let computeCount = 0;

        const doubleCount = createMemoizedSelector(count, value => {
          computeCount++;
          return value * 2;
        });

        // 초기 계산
        expect(doubleCount()).toBe(0);
        expect(computeCount).toBe(1);

        // 동일한 값 재사용 (캐시 히트)
        expect(doubleCount()).toBe(0);
        expect(computeCount).toBe(1);

        // 값 변경 후 재계산
        setCount(5);
        expect(doubleCount()).toBe(10);
        expect(computeCount).toBe(2);
      });
    });

    it('should use Object.is for reference equality check', () => {
      createRoot(() => {
        const [state, setState] = createSignal({ count: 0 });
        let computeCount = 0;

        const selectCount = createMemoizedSelector(state, s => {
          computeCount++;
          return s.count;
        });

        // 초기 계산
        expect(selectCount()).toBe(0);
        expect(computeCount).toBe(1);

        // 같은 객체 참조 → 캐시 히트
        expect(selectCount()).toBe(0);
        expect(computeCount).toBe(1);

        // 새로운 객체 → 재계산
        setState({ count: 0 });
        expect(selectCount()).toBe(0);
        expect(computeCount).toBe(2);
      });
    });

    it('should track statistics (calls, hits, misses)', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);

        const selector = createMemoizedSelector(count, v => v * 2);

        resetGlobalStats();

        // 첫 호출 (miss)
        selector();
        let stats = getGlobalStats();
        expect(stats.selectorCalls).toBe(1);
        expect(stats.cacheMisses).toBe(1);
        expect(stats.cacheHits).toBe(0);

        // 두 번째 호출 (hit)
        selector();
        stats = getGlobalStats();
        expect(stats.selectorCalls).toBe(2);
        expect(stats.cacheHits).toBe(1);
        expect(stats.cacheMisses).toBe(1);

        // 값 변경 후 호출 (miss)
        setCount(1);
        selector();
        stats = getGlobalStats();
        expect(stats.selectorCalls).toBe(3);
        expect(stats.cacheMisses).toBe(2);
        expect(stats.cacheHits).toBe(1);
      });
    });

    it('should support debug mode with console logging', () => {
      createRoot(() => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        const [count, setCount] = createSignal(0);

        const selector = createMemoizedSelector(
          count,
          v => v * 2,
          true // debug mode
        );

        selector(); // miss
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Signal Selector]'),
          expect.anything()
        );

        selector(); // hit
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Cache hit'),
          expect.anything()
        );

        consoleSpy.mockRestore();
      });
    });

    it('should provide getStats method for individual selector', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);

        const selector = createMemoizedSelector(count, v => v * 2) as ReturnType<
          typeof createMemoizedSelector
        > & {
          getStats: () => { calls: number; hits: number; misses: number };
        };

        selector();
        selector();
        setCount(1);
        selector();

        const stats = selector.getStats();
        expect(stats.calls).toBe(3);
        expect(stats.hits).toBe(1);
        expect(stats.misses).toBe(2);
      });
    });
  });

  describe('createAsyncSelector', () => {
    it('should handle async selector with loading state', async () => {
      createRoot(async dispose => {
        const [userId, setUserId] = createSignal(1);

        const userResult = createAsyncSelector(
          userId,
          async id => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return `User ${id}`;
          },
          'Loading...',
          30 // debounceMs를 짧게 설정
        );

        // 초기 상태
        expect(userResult().value).toBe('Loading...');
        expect(userResult().loading).toBe(true);
        expect(userResult().error).toBe(null);

        // 로딩 완료 대기: debounce(30ms) + async(10ms) + 여유(20ms)
        await new Promise(resolve => setTimeout(resolve, 60));

        expect(userResult().value).toBe('User 1');
        expect(userResult().loading).toBe(false);

        dispose();
      });
    });

    it('should debounce async selector calls', async () => {
      createRoot(async dispose => {
        const [search, setSearch] = createSignal('');
        let fetchCount = 0;

        const searchResult = createAsyncSelector(
          search,
          async query => {
            fetchCount++;
            await new Promise(resolve => setTimeout(resolve, 10));
            return `Results for: ${query}`;
          },
          'No results',
          50 // 50ms debounce
        );

        // 빠른 연속 호출
        setSearch('a');
        setSearch('ab');
        setSearch('abc');

        // Debounce 전 → fetch 호출 안 됨
        expect(fetchCount).toBe(0);

        // Debounce 후 → 한 번만 fetch
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(fetchCount).toBe(1);
        expect(searchResult().value).toBe('Results for: abc');

        dispose();
      });
    });

    it('should handle async selector errors', async () => {
      createRoot(async dispose => {
        const [trigger, setTrigger] = createSignal(0);

        const errorResult = createAsyncSelector(
          trigger,
          async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            throw new Error('Fetch failed');
          },
          'Default'
        );

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(errorResult().value).toBe('Default');
        expect(errorResult().loading).toBe(false);
        expect(errorResult().error).toBeInstanceOf(Error);
        expect(errorResult().error?.message).toBe('Fetch failed');

        dispose();
      });
    });

    it('should cancel previous async calls on new trigger', async () => {
      createRoot(async dispose => {
        const [id, setId] = createSignal(1);
        let completedIds: number[] = [];

        const result = createAsyncSelector(
          id,
          async value => {
            await new Promise(resolve => setTimeout(resolve, 50));
            completedIds.push(value);
            return `Result ${value}`;
          },
          'None'
        );

        setId(2);
        await new Promise(resolve => setTimeout(resolve, 10));
        setId(3);

        // 충분히 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        // 마지막 요청만 완료되어야 함
        expect(result().value).toBe('Result 3');
        expect(completedIds).toEqual([3]); // 1, 2는 취소됨

        dispose();
      });
    });
  });

  describe('Global Statistics', () => {
    it('should track global selector statistics', () => {
      createRoot(() => {
        resetGlobalStats();

        const [a, setA] = createSignal(1);
        const [b, setB] = createSignal(2);

        const selectorA = createMemoizedSelector(a, v => v * 2);
        const selectorB = createMemoizedSelector(b, v => v * 3);

        selectorA(); // miss
        selectorA(); // hit
        selectorB(); // miss
        setA(2);
        selectorA(); // miss

        const stats = getGlobalStats();
        expect(stats.selectorCalls).toBe(4);
        expect(stats.cacheHits).toBe(1);
        expect(stats.cacheMisses).toBe(3);
      });
    });

    it('should reset global statistics', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);
        const selector = createMemoizedSelector(count, v => v);

        selector();
        expect(getGlobalStats().selectorCalls).toBeGreaterThan(0);

        resetGlobalStats();
        const stats = getGlobalStats();
        expect(stats.selectorCalls).toBe(0);
        expect(stats.cacheHits).toBe(0);
        expect(stats.cacheMisses).toBe(0);
      });
    });
  });

  describe('Debug Mode', () => {
    it('should enable/disable debug mode globally', () => {
      expect(isDebugMode()).toBe(false);

      setDebugMode(true);
      expect(isDebugMode()).toBe(true);

      setDebugMode(false);
      expect(isDebugMode()).toBe(false);
    });

    it('should log when debug mode is enabled globally', () => {
      createRoot(() => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        setDebugMode(true);

        const [count, setCount] = createSignal(0);
        const selector = createMemoizedSelector(count, v => v * 2);

        selector();
        expect(consoleSpy).toHaveBeenCalled();

        setDebugMode(false);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Solid Primitives Migration', () => {
    it('should not require useCallback (Solid components run once)', () => {
      createRoot(() => {
        // Solid에서는 컴포넌트가 한 번만 실행되므로 useCallback 불필요
        const [count, setCount] = createSignal(0);

        // 이 함수는 자동으로 안정적임 (재생성되지 않음)
        const handleClick = () => {
          setCount(c => c + 1);
        };

        // handleClick의 참조는 변하지 않음
        const ref1 = handleClick;
        setCount(1);
        const ref2 = handleClick;

        expect(ref1).toBe(ref2);
      });
    });

    it('should use createMemo instead of useMemo', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);
        let computeCount = 0;

        // Solid의 createMemo는 자동으로 의존성 추적
        const selector = createMemoizedSelector(count, v => {
          computeCount++;
          return v * 2;
        });

        selector();
        selector();
        expect(computeCount).toBe(1); // 메모이제이션 동작

        setCount(1);
        selector();
        expect(computeCount).toBe(2); // 값 변경 시 재계산
      });
    });
  });
});
