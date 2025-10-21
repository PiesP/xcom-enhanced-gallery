/**
 * Solid.js Advanced Reactivity 테스트 (Browser 모드)
 *
 * Phase B1: JSDOM에서 검증 불가능한 고급 Solid.js API 테스트
 * - createMemo: 파생 값 메모이제이션
 * - onCleanup: Effect cleanup 로직
 * - createRoot: 반응성 컨텍스트 격리
 * - batch: 일괄 업데이트 최적화
 * - For: 참조 안정성 리스트 렌더링
 * - Show: 조건부 렌더링
 *
 * @see test/browser/REACTIVITY_TEST_STRATEGY.md - 전략 문서
 * @see docs/SOLID_REACTIVITY_LESSONS.md - Phase 80.1 교훈
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSolid, render, For, Show } from '@shared/external/vendors';

const { createSignal, createEffect, createMemo, onCleanup, createRoot, batch } = getSolid();

describe('Solid.js Advanced Reactivity in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  describe('createMemo - Memoization', () => {
    it('should memoize derived values efficiently', async () => {
      const [count, setCount] = createSignal(1);
      const [multiplier, setMultiplier] = createSignal(2);

      let computationCount = 0;

      // 복잡한 계산을 createMemo로 최적화
      const result = createMemo(() => {
        computationCount++;
        return count() * multiplier();
      });

      const display = document.createElement('div');
      container.appendChild(display);

      createEffect(() => {
        display.textContent = String(result());
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      // 초기 계산 1회
      expect(computationCount).toBe(1);
      expect(display.textContent).toBe('2'); // 1 * 2

      // count 변경 → 재계산
      setCount(3);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(computationCount).toBe(2);
      expect(display.textContent).toBe('6'); // 3 * 2

      // multiplier 변경 → 재계산
      setMultiplier(4);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(computationCount).toBe(3);
      expect(display.textContent).toBe('12'); // 3 * 4

      // 동일 값으로 설정 → 재계산 없음
      setCount(3);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(computationCount).toBe(3); // 여전히 3
      expect(display.textContent).toBe('12');
    });

    it('should skip recomputation when dependencies do not change', async () => {
      const [firstName, setFirstName] = createSignal('Alice');
      const [lastName, setLastName] = createSignal('Johnson');
      const [age, setAge] = createSignal(25);

      let fullNameComputations = 0;

      // firstName과 lastName만 의존
      const fullName = createMemo(() => {
        fullNameComputations++;
        return `${firstName()} ${lastName()}`;
      });

      const display = document.createElement('div');
      container.appendChild(display);

      createEffect(() => {
        // age도 읽지만, fullName memo는 age에 의존하지 않음
        display.textContent = `${fullName()}, Age: ${age()}`;
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fullNameComputations).toBe(1);
      expect(display.textContent).toBe('Alice Johnson, Age: 25');

      // age 변경 → fullName 재계산 없음
      setAge(30);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fullNameComputations).toBe(1); // 여전히 1
      expect(display.textContent).toBe('Alice Johnson, Age: 30');

      // firstName 변경 → fullName 재계산
      setFirstName('Bob');
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(fullNameComputations).toBe(2);
      expect(display.textContent).toBe('Bob Johnson, Age: 30');
    });
  });

  describe('onCleanup - Cleanup Logic', () => {
    it('should execute cleanup when effect re-runs', async () => {
      const [count, setCount] = createSignal(0);

      let cleanupExecuted = false;
      let effectRuns = 0;

      createEffect(() => {
        effectRuns++;
        count(); // 의존성 추적

        onCleanup(() => {
          cleanupExecuted = true;
        });
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(effectRuns).toBe(1);
      expect(cleanupExecuted).toBe(false);

      // Signal 업데이트 → Effect 재실행 → 이전 cleanup 실행
      setCount(1);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(effectRuns).toBe(2);
      expect(cleanupExecuted).toBe(true);
    });

    it('should cleanup timers to prevent memory leaks', async () => {
      const [active, setActive] = createSignal(true);

      let timerFired = false;
      let cleanupCalled = false;

      createEffect(() => {
        if (active()) {
          const timer = setTimeout(() => {
            timerFired = true;
          }, 100);

          onCleanup(() => {
            cleanupCalled = true;
            clearTimeout(timer);
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(cleanupCalled).toBe(false);
      expect(timerFired).toBe(false);

      // Effect 재실행 → cleanup으로 타이머 취소
      setActive(false);
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(cleanupCalled).toBe(true);

      // 타이머가 취소되어 실행되지 않음
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(timerFired).toBe(false);
    });

    it('should cleanup event listeners on re-run', async () => {
      const [target, setTarget] = createSignal<HTMLElement | null>(null);

      let listenerCalls = 0;
      let cleanupCalls = 0;

      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      container.appendChild(button1);
      container.appendChild(button2);

      createEffect(() => {
        const el = target();
        if (el) {
          const handler = () => {
            listenerCalls++;
          };
          el.addEventListener('click', handler);

          onCleanup(() => {
            cleanupCalls++;
            el.removeEventListener('click', handler);
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      // button1에 리스너 등록
      setTarget(button1);
      await new Promise(resolve => setTimeout(resolve, 0));

      button1.click();
      expect(listenerCalls).toBe(1);
      expect(cleanupCalls).toBe(0);

      // button2로 변경 → button1 리스너 정리
      setTarget(button2);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(cleanupCalls).toBe(1);

      // button1 클릭해도 반응 없음 (리스너 제거됨)
      button1.click();
      expect(listenerCalls).toBe(1);

      // button2 클릭 → 새 리스너 작동
      button2.click();
      expect(listenerCalls).toBe(2);
    });
  });

  describe('createRoot - Reactivity Isolation', () => {
    it('should dispose entire reactivity tree with createRoot', async () => {
      let effectActive = false;

      const dispose = createRoot(dispose => {
        const [signal, setSignal] = createSignal(0);

        createEffect(() => {
          effectActive = true;
          signal();
        });

        // Signal 업데이트 예약
        setTimeout(() => setSignal(1), 50);

        return dispose;
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(effectActive).toBe(true);

      effectActive = false;

      // dispose 호출
      dispose();

      // Signal 업데이트가 예약되어 있지만, dispose로 인해 Effect 실행 안 됨
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(effectActive).toBe(false);
    });
  });

  describe('batch - Batch Updates', () => {
    it('should batch multiple signal updates into single effect run', async () => {
      const [count, setCount] = createSignal(0);
      const [text, setText] = createSignal('Initial');
      const [flag, setFlag] = createSignal(false);

      let effectRuns = 0;

      const display = document.createElement('div');
      container.appendChild(display);

      createEffect(() => {
        effectRuns++;
        display.textContent = `${text()}: ${count()} (${flag()})`;
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(effectRuns).toBe(1);
      expect(display.textContent).toBe('Initial: 0 (false)');

      // 개별 업데이트 → Effect 3회 실행
      setCount(1);
      await new Promise(resolve => setTimeout(resolve, 0));
      setText('Step 1');
      await new Promise(resolve => setTimeout(resolve, 0));
      setFlag(true);
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(effectRuns).toBe(4); // 초기 1 + 업데이트 3
      expect(display.textContent).toBe('Step 1: 1 (true)');

      // batch로 일괄 업데이트 → Effect 1회만 실행
      batch(() => {
        setCount(10);
        setText('Batched');
        setFlag(false);
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(effectRuns).toBe(5); // 1회만 추가
      expect(display.textContent).toBe('Batched: 10 (false)');
    });

    it('should optimize performance with batch for large updates', async () => {
      const [items, setItems] = createSignal<number[]>([]);

      let renderCount = 0;

      const list = document.createElement('ul');
      container.appendChild(list);

      createEffect(() => {
        renderCount++;
        list.innerHTML = '';
        items().forEach(item => {
          const li = document.createElement('li');
          li.textContent = String(item);
          list.appendChild(li);
        });
      });

      await new Promise(resolve => setTimeout(resolve, 0));
      expect(renderCount).toBe(1);

      // 개별 업데이트 10회 → Effect 10회
      for (let i = 0; i < 10; i++) {
        setItems(prev => [...prev, i]);
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      expect(renderCount).toBe(11); // 초기 1 + 업데이트 10
      expect(list.children.length).toBe(10);

      // batch로 10개 추가 → Effect 1회
      batch(() => {
        for (let i = 10; i < 20; i++) {
          setItems(prev => [...prev, i]);
        }
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(renderCount).toBe(12); // 1회만 추가
      expect(list.children.length).toBe(20);
    });
  });
});
