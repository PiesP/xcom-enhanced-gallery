/**
 * Solid.js 반응성 테스트 (Browser 모드)
 *
 * JSDOM에서는 Solid.js의 fine-grained reactivity가 제한적이지만,
 * 실제 브라우저에서는 완전히 작동합니다.
 *
 * @see docs/SOLID_REACTIVITY_LESSONS.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid, getSolidStore } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();
const { createStore } = getSolidStore();

describe('Solid.js Reactivity in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should reactively update DOM when signal changes', async () => {
    const [count, setCount] = createSignal(0);

    // DOM에 렌더링
    const button = document.createElement('button');
    button.textContent = String(count());
    container.appendChild(button);

    // Effect로 자동 업데이트 연결
    createEffect(() => {
      button.textContent = String(count());
    });

    expect(button.textContent).toBe('0');

    // Signal 업데이트
    setCount(1);

    // 브라우저 환경에서는 즉시 반영됨 (microtask)
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(button.textContent).toBe('1');
  });

  it('should reactively update with store changes', async () => {
    const [state, setState] = createStore({ count: 0, text: 'Hello' });

    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      display.textContent = `${state.text}: ${state.count}`;
    });

    expect(display.textContent).toBe('Hello: 0');

    // Store 업데이트
    setState('count', c => c + 1);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(display.textContent).toBe('Hello: 1');

    // 다중 속성 업데이트
    setState({ text: 'World', count: 10 });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(display.textContent).toBe('World: 10');
  });

  it('should handle nested effects correctly', async () => {
    const [outer, setOuter] = createSignal(1);
    const [inner, setInner] = createSignal(10);

    const results: number[] = [];

    createEffect(() => {
      const outerValue = outer();
      createEffect(() => {
        results.push(outerValue + inner());
      });
    });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(results).toContain(11); // 1 + 10

    setInner(20);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(results).toContain(21); // 1 + 20

    setOuter(2);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(results).toContain(22); // 2 + 20
  });
});
