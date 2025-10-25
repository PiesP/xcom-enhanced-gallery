/**
 * Solid.js Store Reactivity (Browser Mode)
 *
 * **Purpose**: Verify Store fine-grained reactivity in actual browser.
 * Tests nested properties, array mutations, batching, and conditional rendering.
 *
 * **Why Browser Mode**: Store tracking and DOM updates require real event loop.
 *
 * @see solid-reactivity.test.ts
 * @see TESTING_STRATEGY.md#browser-tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getSolid, getSolidStore } from '@shared/external/vendors';

const { createEffect } = getSolid();
const { createStore } = getSolidStore();

describe('Solid.js Store Reactivity (Browser)', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should reactively update nested store properties', async () => {
    const [state, setState] = createStore({
      user: { name: 'Alice', age: 25 },
      preferences: { theme: 'dark', language: 'ko' },
    });

    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      display.textContent = `${state.user.name} (${state.user.age}) - ${state.preferences.theme}`;
    });

    expect(display.textContent).toBe('Alice (25) - dark');

    setState('user', 'age', 30);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(display.textContent).toBe('Alice (30) - dark');

    setState('preferences', 'theme', 'light');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(display.textContent).toBe('Alice (30) - light');
  });

  it('should handle array mutations reactively', async () => {
    const [state, setState] = createStore({
      items: ['apple', 'banana', 'cherry'],
    });

    const list = document.createElement('ul');
    container.appendChild(list);

    createEffect(() => {
      list.innerHTML = '';
      state.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });
    });

    expect(list.children.length).toBe(3);

    setState('items', items => [...items, 'date']);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(list.children.length).toBe(4);

    setState('items', items => items.filter(item => item !== 'banana'));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(list.children.length).toBe(3);
  });

  it('should batch multiple store updates', async () => {
    const [state, setState] = createStore({
      count: 0,
      text: 'Initial',
      flag: false,
    });

    let effectCount = 0;
    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      effectCount++;
      display.textContent = `${state.text}: ${state.count} (${state.flag})`;
    });

    expect(effectCount).toBe(1);

    setState({ count: 10, text: 'Updated', flag: true });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(effectCount).toBe(2); // Batched - single effect run
    expect(display.textContent).toBe('Updated: 10 (true)');
  });

  it('should handle conditional rendering based on store', async () => {
    const [state, setState] = createStore({
      isLoggedIn: false,
      username: 'Guest',
    });

    const wrapper = document.createElement('div');
    container.appendChild(wrapper);

    createEffect(() => {
      wrapper.innerHTML = '';
      if (state.isLoggedIn) {
        const welcome = document.createElement('p');
        welcome.textContent = `Welcome, ${state.username}!`;
        wrapper.appendChild(welcome);
      } else {
        const button = document.createElement('button');
        button.textContent = 'Login';
        wrapper.appendChild(button);
      }
    });

    expect(wrapper.querySelector('button')).toBeTruthy();
    expect(wrapper.querySelector('p')).toBeNull();

    setState({ isLoggedIn: true, username: 'Alice' });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(wrapper.querySelector('button')).toBeNull();
    expect(wrapper.querySelector('p')?.textContent).toBe('Welcome, Alice!');
  });

  it('should track only accessed properties (fine-grained)', async () => {
    const [state, setState] = createStore({
      a: 1,
      b: 2,
      c: 3,
    });

    let effectCount = 0;
    const display = document.createElement('div');
    container.appendChild(display);

    // Effect reads a and b only (c is not tracked)
    createEffect(() => {
      effectCount++;
      display.textContent = `${state.a} + ${state.b} = ${state.a + state.b}`;
    });

    expect(effectCount).toBe(1);

    setState('c', 10);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(effectCount).toBe(1); // c change doesn't trigger re-run

    setState('a', 5);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(effectCount).toBe(2);
    expect(display.textContent).toBe('5 + 2 = 7');
  });
});
