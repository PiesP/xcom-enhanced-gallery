/**
 * Solid.js Reactivity (Browser Mode)
 *
 * **Purpose**: Verify Solid.js fine-grained reactivity in actual browser.
 * JSDOM has limited support for signal tracking and DOM updates.
 *
 * **Why Browser Mode**: @vitest/browser with Chromium allows:
 * - Complete Solid.js reactivity system validation
 * - Actual DOM microtask scheduling
 * - Real browser event loop
 *
 * @see docs/SOLID_REACTIVITY_LESSONS.md
 * @see TESTING_STRATEGY.md#browser-tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { getSolid, getSolidStore } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();
const { createStore } = getSolidStore();

describe('Solid.js Reactivity (Browser)', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should reactively update DOM when signal changes', async () => {
    const [count, setCount] = createSignal(0);
    const button = document.createElement('button');
    button.textContent = `count: ${count()}`;
    container.appendChild(button);

    createEffect(() => {
      button.textContent = `count: ${count()}`;
    });

    expect(button.textContent).toBe('count: 0');

    setCount(1);
    await new Promise(resolve => setTimeout(resolve, 0)); // microtask

    expect(button.textContent).toBe('count: 1');
  });

  it('should reactively update with store changes', async () => {
    const [state, setState] = createStore({ count: 0, text: 'Hello' });
    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      display.textContent = `${state.text}: ${state.count}`;
    });

    expect(display.textContent).toBe('Hello: 0');

    setState('count', c => c + 1);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(display.textContent).toBe('Hello: 1');

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
