/**
 * @fileoverview Signal Selector Optimization Unit Tests (Solid.js)
 *
 * Solid.js Signal selector 성능 최적화 유틸리티들을 검증합니다.
 */

import { describe, test, expect, vi } from 'vitest';
import { getSolid } from '../../../src/shared/external/vendors';
import { createSelector, createCombinedSelector } from '../../../src/shared/utils/signalSelector';

const { createSignal, createMemo } = getSolid();

describe('Signal Selector Optimization Unit Tests (Solid.js)', () => {
  describe('createSelector', () => {
    test('Signal에서 값을 선택해야 함', () => {
      const [state] = createSignal({ user: { name: 'John', age: 30 }, counter: 0 });

      const selectUserName = createSelector(state, s => s.user.name);

      expect(selectUserName()).toBe('John');
    });

    test('의존성 기반 메모이제이션을 수행해야 함', () => {
      const [state, setState] = createSignal({
        user: { name: 'John', age: 30 },
        counter: 0,
      });

      const computeSpy = vi.fn((s: any) => s.user.name.toUpperCase());
      const selector = createSelector(state, computeSpy, {
        dependencies: s => [s.user.name],
      });

      // 첫 번째 계산
      expect(selector()).toBe('JOHN');
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // counter만 변경 - 의존성 동일하므로 재계산 안됨
      setState({ user: { name: 'John', age: 30 }, counter: 1 });
      expect(selector()).toBe('JOHN');
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // name 변경 - 의존성 변경으로 재계산
      setState({ user: { name: 'Jane', age: 30 }, counter: 1 });
      expect(selector()).toBe('JANE');
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });

    test('디버그 모드에서 통계를 제공해야 함', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const [state] = createSignal({ value: 5 });
      const selector = createSelector(state, s => s.value * 2, {
        debug: true,
        name: 'TestSelector',
      });

      selector();
      selector();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('Object.is를 사용한 참조 동일성 검사', () => {
      const [state, setState] = createSignal({ items: [1, 2, 3] });
      const computeSpy = vi.fn((s: any) => s.items);

      const selector = createSelector(state, computeSpy);

      // 첫 번째 호출
      const result1 = selector();
      expect(result1).toEqual([1, 2, 3]);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 새 배열로 설정 - 재계산됨
      setState({ items: [1, 2, 3] });
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('createCombinedSelector', () => {
    test('여러 Signal을 조합해야 함', () => {
      const [signal1] = createSignal(10);
      const [signal2] = createSignal(20);

      const combined = createCombinedSelector([signal1, signal2], ([a, b]) => a + b);

      expect(combined()).toBe(30);
    });

    test('Signal 변경 시 재계산되어야 함', () => {
      const [signal1, setSignal1] = createSignal(10);
      const [signal2, setSignal2] = createSignal(20);

      const computeSpy = vi.fn(([a, b]: [number, number]) => a + b);
      const combined = createCombinedSelector([signal1, signal2], computeSpy);

      expect(combined()).toBe(30);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      setSignal1(15);
      expect(combined()).toBe(35);
      expect(computeSpy).toHaveBeenCalledTimes(2);

      setSignal2(25);
      expect(combined()).toBe(40);
      expect(computeSpy).toHaveBeenCalledTimes(3);
    });

    test('복잡한 객체 조합', () => {
      const [user] = createSignal({ name: 'John', age: 30 });
      const [posts] = createSignal([
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ]);

      const combined = createCombinedSelector([user, posts], ([u, p]) => ({
        userName: u.name,
        postCount: p.length,
      }));

      const result = combined();
      expect(result.userName).toBe('John');
      expect(result.postCount).toBe(2);
    });
  });

  describe('createMemo 기반 성능 최적화', () => {
    test('동일한 값에 대해 재계산하지 않아야 함', () => {
      const computeSpy = vi.fn((value: number) => value * 2);
      const [signal, setSignal] = createSignal(5);

      const doubled = createMemo(() => computeSpy(signal()));

      expect(doubled()).toBe(10);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 같은 값으로 설정 - Solid는 값 비교로 재계산 안함
      setSignal(5);
      expect(doubled()).toBe(10);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 다른 값으로 변경
      setSignal(10);
      expect(doubled()).toBe(20);
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });

    test('중첩된 memo 작동', () => {
      const [signal, setSignal] = createSignal(5);

      const doubled = createMemo(() => signal() * 2);
      const quadrupled = createMemo(() => doubled() * 2);

      expect(quadrupled()).toBe(20);

      setSignal(10);
      expect(quadrupled()).toBe(40);
    });

    test('복잡한 데이터 구조 메모이제이션', () => {
      const computeSpy = vi.fn((items: number[]) => items.filter(x => x % 2 === 0));
      const [signal, setSignal] = createSignal([1, 2, 3, 4, 5]);

      const evenNumbers = createMemo(() => computeSpy(signal()));

      expect(evenNumbers()).toEqual([2, 4]);
      expect(computeSpy).toHaveBeenCalledTimes(1);

      // 배열 변경
      setSignal([2, 4, 6, 8]);
      expect(evenNumbers()).toEqual([2, 4, 6, 8]);
      expect(computeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('실전 사용 패턴', () => {
    test('깊은 중첩 객체에서 값 선택', () => {
      const [state] = createSignal({
        user: {
          profile: {
            personal: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
        },
      });

      const selectFirstName = createSelector(state, s => s.user.profile.personal.firstName);

      expect(selectFirstName()).toBe('John');
    });

    test('배열 필터링 최적화', () => {
      const [state, setState] = createSignal({
        items: [1, 2, 3, 4, 5, 6],
        filterThreshold: 3,
      });

      const filterSpy = vi.fn((s: any) => s.items.filter((x: number) => x > s.filterThreshold));

      const filtered = createSelector(state, filterSpy, {
        dependencies: s => [s.items, s.filterThreshold],
      });

      expect(filtered()).toEqual([4, 5, 6]);
      expect(filterSpy).toHaveBeenCalledTimes(1);

      // 동일 값으로 설정 - 재계산 안됨
      setState({ ...state(), filterThreshold: 3 });
      expect(filterSpy).toHaveBeenCalledTimes(1);

      // filterThreshold 변경
      setState({ ...state(), filterThreshold: 4 });
      expect(filtered()).toEqual([5, 6]);
      expect(filterSpy).toHaveBeenCalledTimes(2);
    });

    test('여러 Signal 조합하여 파생 상태 생성', () => {
      const [count1, setCount1] = createSignal(0);
      const [count2, setCount2] = createSignal(0);
      const [count3, setCount3] = createSignal(0);

      const total = createCombinedSelector([count1, count2, count3], ([a, b, c]) => a + b + c);

      expect(total()).toBe(0);

      setCount1(10);
      expect(total()).toBe(10);

      setCount2(20);
      expect(total()).toBe(30);

      setCount3(30);
      expect(total()).toBe(60);
    });
  });
});
