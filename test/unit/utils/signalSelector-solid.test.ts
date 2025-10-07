/**
 * @fileoverview Solid.js Signal Selector Tests (Phase 3)
 *
 * Solid createMemo 기반 signal selector 검증
 * - TDD RED 단계: 구현 전 테스트 작성
 * - 기존 Preact Hooks API와 동일한 기능 제공
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@/shared/external/vendors';

// Solid API 가져오기
const { createSignal, createMemo, createRoot } = getSolid();

// 임포트할 함수들 (아직 구현되지 않음)
import {
  createSelector,
  createCombinedSelector,
  type SelectorFn,
  type SelectorOptions,
} from '@/shared/utils/signalSelector-solid';

describe('signalSelector-solid (Phase 3 TDD)', () => {
  describe('createSelector', () => {
    it('should create a memoized selector from signal', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);
        const doubleCount = createSelector(count, value => value * 2);

        expect(doubleCount()).toBe(0);

        setCount(5);
        expect(doubleCount()).toBe(10);

        setCount(10);
        expect(doubleCount()).toBe(20);
      });
    });

    it('should memoize selector result to prevent unnecessary recalculations', () => {
      createRoot(() => {
        const [state, setState] = createSignal({ count: 0, name: 'test' });
        let computeCount = 0;

        const selectCount = createSelector(state, s => {
          computeCount++;
          return s.count;
        });

        // 초기 계산
        expect(selectCount()).toBe(0);
        expect(computeCount).toBe(1);

        // 동일한 count 값으로 state 업데이트 (name만 변경)
        setState({ count: 0, name: 'updated' });

        // Solid는 state 시그널 전체가 변경되면 selector가 재실행됨
        // (하지만 결과값은 메모이제이션으로 동일)
        expect(selectCount()).toBe(0);
        expect(computeCount).toBe(2); // Solid의 동작: source 변경 → selector 재계산

        // count 변경 시에도 재계산
        setState({ count: 5, name: 'updated' });
        expect(selectCount()).toBe(5);
        expect(computeCount).toBe(3); // 이전에 2번, 이번 1번
      });
    });

    it('should support dependency-based caching with options', () => {
      createRoot(() => {
        const [state, setState] = createSignal({
          user: { id: 1, name: 'Alice' },
          timestamp: Date.now(),
        });
        let computeCount = 0;

        const selectUserId = createSelector(
          state,
          s => {
            computeCount++;
            return s.user.id;
          },
          {
            dependencies: s => [s.user.id] as const,
          }
        );

        // 초기 계산
        expect(selectUserId()).toBe(1);
        expect(computeCount).toBe(1);

        // timestamp만 변경 (user.id는 동일)
        setState({ ...state(), timestamp: Date.now() + 1000 });

        // 의존성(user.id)이 변경되지 않았으므로 재계산 안 됨
        expect(selectUserId()).toBe(1);
        expect(computeCount).toBe(1);

        // user.id 변경 시 재계산
        setState({
          user: { id: 2, name: 'Bob' },
          timestamp: Date.now(),
        });
        expect(selectUserId()).toBe(2);
        expect(computeCount).toBe(2);
      });
    });

    it('should support debug mode with statistics', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);

        const selector = createSelector(count, value => value * 2, {
          debug: true,
          name: 'doubleCount',
        });

        // 초기 계산
        expect(selector()).toBe(0);

        // 동일 값 설정 (캐시 히트)
        setCount(0);
        expect(selector()).toBe(0);

        // 새 값 설정 (캐시 미스)
        setCount(5);
        expect(selector()).toBe(10);

        // 통계 확인 (옵션)
        if ('getStats' in selector) {
          const stats = (selector as any).getStats();
          expect(stats).toHaveProperty('computeCount');
          expect(stats).toHaveProperty('cacheHits');
        }
      });
    });
  });

  describe('createCombinedSelector', () => {
    it('should combine multiple signals into one computed value', () => {
      createRoot(() => {
        const [firstName, setFirstName] = createSignal('John');
        const [lastName, setLastName] = createSignal('Doe');

        const fullName = createCombinedSelector(
          [firstName, lastName],
          ([first, last]) => `${first} ${last}`
        );

        expect(fullName()).toBe('John Doe');

        setFirstName('Jane');
        expect(fullName()).toBe('Jane Doe');

        setLastName('Smith');
        expect(fullName()).toBe('Jane Smith');
      });
    });

    it('should memoize combined result', () => {
      createRoot(() => {
        const [count, setCount] = createSignal(0);
        const [name, setName] = createSignal('test');
        let computeCount = 0;

        const combined = createCombinedSelector([count, name], ([c, n]) => {
          computeCount++;
          return `${n}: ${c}`;
        });

        // 초기 계산
        expect(combined()).toBe('test: 0');
        expect(computeCount).toBe(1);

        // count만 변경
        setCount(5);
        expect(combined()).toBe('test: 5');
        expect(computeCount).toBe(2);

        // name만 변경
        setName('updated');
        expect(combined()).toBe('updated: 5');
        expect(computeCount).toBe(3);
      });
    });

    it('should support empty signals array', () => {
      createRoot(() => {
        const constant = createCombinedSelector([], () => 'constant value');

        expect(constant()).toBe('constant value');
      });
    });

    it('should handle complex state combinations', () => {
      createRoot(() => {
        const [user, setUser] = createSignal({ id: 1, name: 'Alice' });
        const [settings, setSettings] = createSignal({ theme: 'dark', lang: 'en' });
        const [online, setOnline] = createSignal(true);

        const userProfile = createCombinedSelector([user, settings, online], ([u, s, o]) => ({
          userId: u.id,
          displayName: u.name,
          theme: s.theme,
          language: s.lang,
          status: o ? 'online' : 'offline',
        }));

        const result = userProfile();
        expect(result.userId).toBe(1);
        expect(result.displayName).toBe('Alice');
        expect(result.theme).toBe('dark');
        expect(result.status).toBe('online');

        setOnline(false);
        expect(userProfile().status).toBe('offline');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle selector errors gracefully', () => {
      createRoot(() => {
        const [value, setValue] = createSignal<number | null>(0);

        const selector = createSelector(value, v => {
          if (v === null) throw new Error('Value is null');
          return v * 2;
        });

        // 정상 동작 확인
        expect(selector()).toBe(0);

        // Solid의 리액티브 시스템: setValue 호출 시 즉시 모든 구독자 업데이트
        // selector()가 이미 source를 구독 중이므로 setValue(null) 호출 시 에러 발생
        try {
          setValue(null);
          // 에러가 발생해야 함
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect((error as Error).message).toBe('Value is null');
        }
      });
    });
  });

  describe('Performance', () => {
    it('should not recompute when dependencies have not changed', () => {
      createRoot(() => {
        const [state, setState] = createSignal({
          a: 1,
          b: 2,
          c: 3,
        });
        let aComputeCount = 0;
        let bComputeCount = 0;

        const selectA = createSelector(
          state,
          s => {
            aComputeCount++;
            return s.a;
          },
          { dependencies: s => [s.a] as const }
        );

        const selectB = createSelector(
          state,
          s => {
            bComputeCount++;
            return s.b;
          },
          { dependencies: s => [s.b] as const }
        );

        // 초기 계산
        expect(selectA()).toBe(1);
        expect(selectB()).toBe(2);
        expect(aComputeCount).toBe(1);
        expect(bComputeCount).toBe(1);

        // c만 변경 (a, b 의존성 변경 없음)
        setState({ ...state(), c: 10 });

        expect(selectA()).toBe(1);
        expect(selectB()).toBe(2);
        // Solid는 createMemo로 자동 메모이제이션되므로 재계산 안 됨
        expect(aComputeCount).toBe(1);
        expect(bComputeCount).toBe(1);
      });
    });
  });
});
