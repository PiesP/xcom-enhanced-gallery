/**
 * Store Reactivity 테스트 (Browser 모드)
 *
 * Solid.js Store의 fine-grained reactivity를 실제 브라우저에서 검증합니다.
 * JSDOM에서는 Store 변경이 DOM에 즉시 반영되지 않을 수 있으므로,
 * 브라우저 환경에서 테스트합니다.
 *
 * @see solid-reactivity.test.ts - Signal 반응성 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid, getSolidStore } from '@shared/external/vendors';

const { createEffect } = getSolid();
const { createStore } = getSolidStore();

describe('Solid.js Store Reactivity in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should reactively update with nested store properties', async () => {
    const [state, setState] = createStore({
      user: {
        name: 'Alice',
        age: 25,
      },
      preferences: {
        theme: 'dark',
        language: 'ko',
      },
    });

    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      display.textContent = `${state.user.name} (${state.user.age}) - ${state.preferences.theme}`;
    });

    expect(display.textContent).toBe('Alice (25) - dark');

    // 중첩 속성 업데이트
    setState('user', 'age', 30);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(display.textContent).toBe('Alice (30) - dark');

    // 다른 중첩 속성 업데이트
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
    expect(list.children[0].textContent).toBe('apple');

    // 배열에 아이템 추가
    setState('items', items => [...items, 'date']);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(list.children.length).toBe(4);
    expect(list.children[3].textContent).toBe('date');

    // 배열에서 아이템 제거
    setState('items', items => items.filter(item => item !== 'banana'));
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(list.children.length).toBe(3);
    expect([...list.children].map(li => li.textContent)).toEqual(['apple', 'cherry', 'date']);
  });

  it('should batch multiple store updates efficiently', async () => {
    const [state, setState] = createStore({
      count: 0,
      text: 'Initial',
      flag: false,
    });

    let effectRunCount = 0;
    const display = document.createElement('div');
    container.appendChild(display);

    createEffect(() => {
      effectRunCount++;
      display.textContent = `${state.text}: ${state.count} (${state.flag})`;
    });

    expect(effectRunCount).toBe(1);

    // 다중 속성 동시 업데이트 (배치 처리)
    setState({
      count: 10,
      text: 'Updated',
      flag: true,
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    // 배치 업데이트로 인해 Effect는 1회만 추가 실행되어야 함
    expect(effectRunCount).toBe(2);
    expect(display.textContent).toBe('Updated: 10 (true)');
  });

  it('should handle conditional rendering based on store', async () => {
    const [state, setState] = createStore({
      isLoggedIn: false,
      username: 'Guest',
    });

    const container = document.createElement('div');
    document.body.appendChild(container);

    createEffect(() => {
      container.innerHTML = '';
      if (state.isLoggedIn) {
        const welcome = document.createElement('p');
        welcome.textContent = `Welcome, ${state.username}!`;
        container.appendChild(welcome);
      } else {
        const login = document.createElement('button');
        login.textContent = 'Login';
        container.appendChild(login);
      }
    });

    // 초기 상태: 로그인 버튼 표시
    expect(container.querySelector('button')).toBeTruthy();
    expect(container.querySelector('p')).toBeNull();

    // 로그인 상태로 변경
    setState({
      isLoggedIn: true,
      username: 'Alice',
    });

    await new Promise(resolve => setTimeout(resolve, 0));

    // 로그인 후: 환영 메시지 표시
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('Welcome, Alice!');
  });

  it('should track only accessed properties (fine-grained)', async () => {
    const [state, setState] = createStore({
      a: 1,
      b: 2,
      c: 3,
    });

    let effectRunCount = 0;
    const display = document.createElement('div');
    container.appendChild(display);

    // Effect는 a와 b만 읽음 (c는 읽지 않음)
    createEffect(() => {
      effectRunCount++;
      display.textContent = `${state.a} + ${state.b} = ${state.a + state.b}`;
    });

    expect(effectRunCount).toBe(1);

    // c 변경 - Effect 재실행 안 됨
    setState('c', 10);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(effectRunCount).toBe(1); // 여전히 1

    // a 변경 - Effect 재실행됨
    setState('a', 5);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(effectRunCount).toBe(2);
    expect(display.textContent).toBe('5 + 2 = 7');
  });
});
