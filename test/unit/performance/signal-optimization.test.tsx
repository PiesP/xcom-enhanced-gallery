/**
 * @fileoverview P7: Signal Selector Optimization Unit Tests
 *
 * Signal selector 성능 최적화 유틸리티들을 검증합니다.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSignalSafe } from '../../../src/shared/state/signals/signal-factory.ts';
import {
  createSelector,
  useSelector,
  useCombinedSelector,
  useAsyncSelector,
  setDebugMode,
  getGlobalSelectorStats,
  clearGlobalSelectorStats,
  type SelectorFn,
} from '../../../src/shared/utils/signal-selector.ts';
import { act, renderHook, waitFor } from '../../utils/testing-library';
import { logger } from '../../../src/shared/logging';

describe('P7: Signal Selector Optimization Unit Tests', () => {
  beforeEach(() => {
    setDebugMode(false);
    clearGlobalSelectorStats();
  });

  afterEach(() => {
    setDebugMode(false);
  });

  describe('createSelector', () => {
    test('기본 selector를 생성해야 함', () => {
      interface TestState {
        user: { name: string; age: number };
        posts: Array<{ id: number; title: string }>;
      }

      const state: TestState = {
        user: { name: 'John', age: 30 },
        posts: [
          { id: 1, title: 'Post 1' },
          { id: 2, title: 'Post 2' },
        ],
      };

      const selectUserName: SelectorFn<TestState, string> = createSelector(
        state => state.user.name
      );

      expect(selectUserName(state)).toBe('John');
    });

    test('의존성 기반 메모이제이션을 수행해야 함', () => {
      interface TestState {
        user: { name: string; age: number };
        counter: number;
      }

      const computeSpy = vi.fn((state: TestState) => state.user.name.toUpperCase());

      const selector = createSelector(computeSpy, {
        dependencies: state => [state.user.name],
      });

      const state1: TestState = { user: { name: 'John', age: 30 }, counter: 1 };
      const state2: TestState = { user: { name: 'John', age: 30 }, counter: 2 }; // counter만 변경
      const state3: TestState = { user: { name: 'Jane', age: 30 }, counter: 2 }; // name 변경

      // 첫 번째 계산
      expect(selector(state1)).toBe('JOHN');
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // counter만 변경된 경우 - 캐시 사용
      expect(selector(state2)).toBe('JOHN');
      expect(computeSpy).toHaveBeenCalledTimes(1); // 재계산되지 않음

      // name이 변경된 경우 - 재계산
      expect(selector(state3)).toBe('JANE');
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });

    test('디버그 모드에서 성능 통계를 제공해야 함', () => {
      setDebugMode(true);

      // logger.debug를 spy하여 호출 여부 확인
      // (테스트 환경에서는 logger.debug가 조용히 무시되므로, spy로 실제 호출을 감지)
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      const selector = createSelector((state: { value: number }) => state.value * 2, {
        debug: true,
        name: 'TestSelector',
      });

      selector({ value: 5 });
      selector({ value: 5 }); // 같은 값으로 재호출

      // logger.debug가 최소한 한 번 호출되어야 함
      expect(debugSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
    });

    test('Object.is를 사용한 참조 동일성 검사를 수행해야 함', () => {
      const computeSpy = vi.fn((state: { items: number[] }) => state.items);

      const selector = createSelector(computeSpy);

      const items = [1, 2, 3];
      const state1 = { items };

      // 첫 번째 호출
      expect(selector(state1)).toBe(items);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 같은 객체로 두 번째 호출 - 캐시 사용
      expect(selector(state1)).toBe(items);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 다른 객체지만 같은 배열 참조
      const state2 = { items }; // 같은 배열 참조
      expect(selector(state2)).toBe(items);
      expect(computeSpy).toHaveBeenCalledTimes(2); // 객체가 다르므로 재계산

      // 다른 배열 (내용은 같음)
      const state3 = { items: [1, 2, 3] };
      expect(selector(state3)).toEqual(items);
      expect(computeSpy).toHaveBeenCalledTimes(3); // 재계산됨
    });
  });

  describe('useSelector Hook', () => {
    test('Signal에서 값을 선택해야 함', () => {
      const testSignal = createSignalSafe({ user: { name: 'John', age: 30 }, counter: 0 });

      const { result } = renderHook(() => useSelector(testSignal, state => state.user.name));

      expect(result()).toBe('John');
    });

    test('Signal 변경 시 선택된 값만 업데이트해야 함', () => {
      const testSignal = createSignalSafe({ user: { name: 'John', age: 30 }, counter: 0 });

      const renderSpy = vi.fn();

      const { result } = renderHook(() => {
        const accessor = useSelector(testSignal, state => state.user.name, {
          dependencies: state => [state.user.name],
        });
        renderSpy();
        return accessor;
      });

      expect(result()).toBe('John');
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // counter만 변경 (name은 동일)
      act(() => {
        testSignal.value = { ...testSignal.value, counter: 1 };
      });

      // name이 변경되지 않았으므로 컴포넌트가 리렌더링되지 않아야 함
      expect(result()).toBe('John');
    });

    test('의존성 배열을 통한 최적화를 제공해야 함', () => {
      const testSignal = createSignalSafe({ a: 1, b: 2, c: 3 });

      const computeSpy = vi.fn((state: typeof testSignal.value) => state.a + state.b);

      const { result } = renderHook(() =>
        useSelector(testSignal, computeSpy, {
          dependencies: state => [state.a, state.b], // c는 의존성에 없음
        })
      );

      expect(result()).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // c만 변경
      act(() => {
        testSignal.value = { ...testSignal.value, c: 4 };
      });

      // c는 의존성에 없으므로 재계산되지 않아야 함
      expect(computeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCombinedSelector Hook', () => {
    test('여러 Signal을 조합해야 함', () => {
      const signal1 = createSignalSafe(10);
      const signal2 = createSignalSafe(20);
      const signal3 = createSignalSafe(30);

      const { result } = renderHook(() =>
        useCombinedSelector([signal1, signal2, signal3], (a, b, c) => a + b + c)
      );

      expect(result()).toBe(60);
    });

    test('조합된 Signal의 의존성을 최적화해야 함', () => {
      const signal1 = createSignalSafe({ value: 10, metadata: 'a' });
      const signal2 = createSignalSafe({ value: 20, metadata: 'b' });

      const combineSpy = vi.fn(
        (a: typeof signal1.value, b: typeof signal2.value) => a.value + b.value
      );

      const { result } = renderHook(() =>
        useCombinedSelector(
          [signal1, signal2],
          combineSpy,
          (a, b) => [a.value, b.value] // metadata는 의존성에서 제외
        )
      );

      expect(result()).toBe(30);
      expect(combineSpy).toHaveBeenCalledTimes(1);

      // metadata만 변경
      act(() => {
        signal1.value = { ...signal1.value, metadata: 'changed' };
      });

      // value는 변경되지 않았으므로 재계산되지 않아야 함
      expect(combineSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAsyncSelector Hook', () => {
    test('비동기 selector를 처리해야 함', async () => {
      const testSignal = createSignalSafe({ id: 1 });

      const asyncSelector = vi.fn(async (state: typeof testSignal.value) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `User ${state.id}`;
      });

      const { result } = renderHook(() =>
        useAsyncSelector(testSignal, asyncSelector, 'Loading...', 0)
      );

      // 초기 상태
      expect(result().value).toBe('Loading...');
      expect(result().error).toBeNull();

      // 비동기 처리 완료 대기 (좀 더 충분한 시간)
      await waitFor(
        () => {
          expect(result().value).toBe('User 1');
        },
        { timeout: 1000 }
      );

      expect(result().loading).toBe(false);
      expect(result().error).toBeNull();
    });

    test('비동기 selector 에러를 처리해야 함', async () => {
      const testSignal = createSignalSafe({ id: 1 });

      const asyncSelector = vi.fn(async () => {
        throw new Error('Async error');
      });

      const { result } = renderHook(() =>
        useAsyncSelector(testSignal, asyncSelector, 'Default', 0)
      );

      // 에러 발생 대기
      await waitFor(
        () => {
          expect(result().error).toBeInstanceOf(Error);
        },
        { timeout: 1000 }
      );

      expect(result().value).toBe('Default'); // 기본값 유지
      expect(result().loading).toBe(false);
      expect(result().error?.message).toBe('Async error');
    });

    test('디바운싱을 통한 요청 최적화를 수행해야 함', async () => {
      const testSignal = createSignalSafe({ query: 'initial' });

      const asyncSelector = vi.fn(async (state: typeof testSignal.value) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `Result for ${state.query}`;
      });

      const { result } = renderHook(() =>
        useAsyncSelector(testSignal, asyncSelector, 'Default', 50)
      );

      // 빠르게 여러 번 변경
      act(() => {
        testSignal.value = { query: 'test1' };
      });

      act(() => {
        testSignal.value = { query: 'test2' };
      });

      act(() => {
        testSignal.value = { query: 'test3' };
      });

      // 디바운싱으로 인해 마지막 값만 처리되어야 함
      await waitFor(
        () => {
          expect(result().value).toBe('Result for test3');
        },
        { timeout: 1000 }
      );

      expect(result().loading).toBe(false);
      // 디바운싱으로 인해 실제 호출 횟수는 제한됨 (최소 1번, 최대 4번)
      expect(asyncSelector).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Monitoring', () => {
    test('글로벌 통계를 수집해야 함', () => {
      const stats = getGlobalSelectorStats();
      expect(typeof stats).toBe('object');
    });

    test('통계를 초기화할 수 있어야 함', () => {
      clearGlobalSelectorStats();
      const stats = getGlobalSelectorStats();
      expect(Object.keys(stats)).toHaveLength(0);
    });

    test('디버그 모드를 전역으로 설정할 수 있어야 함', () => {
      setDebugMode(true);

      // logger.debug를 spy하여 호출 여부 확인
      const debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});

      const selector = createSelector((state: { value: number }) => state.value, {
        name: 'GlobalDebugTest',
      });

      selector({ value: 42 });

      // 전역 디버그 모드가 활성화되었으므로 logger.debug가 호출되어야 함
      expect(debugSpy).toHaveBeenCalled();

      debugSpy.mockRestore();
    });
  });

  describe('Memory Efficiency', () => {
    test('메모리 누수를 방지해야 함', () => {
      // WeakMap과 같은 메모리 효율적인 구조 사용 검증
      const selector = createSelector((state: { value: number }) => state.value * 2);

      // 여러 번 호출해도 메모리가 증가하지 않아야 함
      for (let i = 0; i < 1000; i++) {
        selector({ value: i });
      }

      // 메모리 누수 검증은 실제 메모리 측정이 어려우므로,
      // 의도된 동작이 수행되는지 확인
      expect(selector({ value: 100 })).toBe(200);
    });

    test('의존성 배열의 얕은 비교를 효율적으로 수행해야 함', () => {
      const computeSpy = vi.fn((state: { items: number[] }) => state.items.length);

      const selector = createSelector(computeSpy, {
        dependencies: state => [state.items.length, state.items[0]], // 첫 번째 요소와 길이만 의존성
      });

      const items1 = [1, 2, 3];
      const items2 = [1, 2, 4]; // 마지막 요소만 변경
      const items3 = [2, 2, 3]; // 첫 번째 요소 변경

      expect(selector({ items: items1 })).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 마지막 요소 변경 - 의존성에 없으므로 재계산되지 않음
      expect(selector({ items: items2 })).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 첫 번째 요소 변경 - 의존성에 있으므로 재계산됨
      expect(selector({ items: items3 })).toBe(3);
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });
  });
});
