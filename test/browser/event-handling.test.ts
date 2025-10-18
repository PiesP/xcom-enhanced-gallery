/**
 * Event Handling 테스트 (Browser 모드)
 *
 * 실제 브라우저 환경에서 이벤트 처리를 검증합니다.
 * - PC 전용 이벤트 (click, keydown, wheel)
 * - 이벤트 위임 (event delegation)
 * - preventDefault/stopPropagation
 * - 커스텀 이벤트
 *
 * JSDOM에서는 일부 이벤트가 제대로 전파되지 않을 수 있습니다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getSolid } from '@shared/external/vendors';

const { createSignal, createEffect } = getSolid();

describe('Event Handling in Browser', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should handle click events correctly', async () => {
    const [clicked, setClicked] = createSignal(false);

    const button = document.createElement('button');
    button.textContent = 'Click me';
    container.appendChild(button);

    button.addEventListener('click', () => {
      setClicked(true);
    });

    expect(clicked()).toBe(false);

    // 클릭 이벤트 트리거
    button.click();

    expect(clicked()).toBe(true);
  });

  it('should handle keyboard events with modifiers', async () => {
    const [lastKey, setLastKey] = createSignal('');
    const [ctrlPressed, setCtrlPressed] = createSignal(false);

    const input = document.createElement('input');
    input.type = 'text';
    container.appendChild(input);

    input.addEventListener('keydown', event => {
      setLastKey(event.key);
      setCtrlPressed(event.ctrlKey);
    });

    input.focus();

    // 키보드 이벤트 시뮬레이션
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      ctrlKey: true,
      bubbles: true,
    });
    input.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(lastKey()).toBe('ArrowLeft');
    expect(ctrlPressed()).toBe(true);
  });

  it('should handle event delegation properly', async () => {
    const [clickedItem, setClickedItem] = createSignal('');

    const list = document.createElement('ul');
    list.innerHTML = `
      <li data-id="item-1">Item 1</li>
      <li data-id="item-2">Item 2</li>
      <li data-id="item-3">Item 3</li>
    `;
    container.appendChild(list);

    // 이벤트 위임: 부모에 핸들러 등록
    list.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'LI') {
        setClickedItem(target.dataset.id || '');
      }
    });

    // 특정 아이템 클릭
    const item2 = list.querySelector('[data-id="item-2"]') as HTMLElement;
    item2.click();

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(clickedItem()).toBe('item-2');
  });

  it('should prevent default behavior when needed', async () => {
    let defaultPrevented = false;

    const link = document.createElement('a');
    link.href = 'https://example.com';
    link.textContent = 'External link';
    container.appendChild(link);

    link.addEventListener('click', event => {
      event.preventDefault();
      defaultPrevented = event.defaultPrevented;
    });

    // 클릭 이벤트 트리거
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(defaultPrevented).toBe(true);
  });

  it('should stop event propagation when needed', async () => {
    let outerClicked = false;
    let innerClicked = false;

    const outer = document.createElement('div');
    const inner = document.createElement('button');
    inner.textContent = 'Inner button';

    outer.appendChild(inner);
    container.appendChild(outer);

    outer.addEventListener('click', () => {
      outerClicked = true;
    });

    inner.addEventListener('click', event => {
      innerClicked = true;
      event.stopPropagation();
    });

    // 내부 버튼 클릭
    inner.click();

    expect(innerClicked).toBe(true);
    expect(outerClicked).toBe(false); // 전파가 중단되어야 함
  });

  it('should handle custom events', async () => {
    const [customData, setCustomData] = createSignal<{ value: number } | null>(null);

    const target = document.createElement('div');
    container.appendChild(target);

    target.addEventListener('customUpdate', ((event: CustomEvent) => {
      setCustomData(event.detail);
    }) as EventListener);

    // 커스텀 이벤트 발생
    const customEvent = new CustomEvent('customUpdate', {
      detail: { value: 42 },
      bubbles: true,
    });
    target.dispatchEvent(customEvent);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(customData()?.value).toBe(42);
  });

  it('should handle wheel events (PC-only)', async () => {
    const [deltaY, setDeltaY] = createSignal(0);

    const scrollable = document.createElement('div');
    scrollable.style.overflow = 'auto';
    scrollable.style.height = '200px';
    container.appendChild(scrollable);

    scrollable.addEventListener('wheel', event => {
      setDeltaY(event.deltaY);
    });

    // Wheel 이벤트 시뮬레이션
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 100,
      bubbles: true,
    });
    scrollable.dispatchEvent(wheelEvent);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(deltaY()).toBe(100);
  });

  it('should handle mouseenter/mouseleave events', async () => {
    const [isHovered, setIsHovered] = createSignal(false);

    const box = document.createElement('div');
    box.style.width = '100px';
    box.style.height = '100px';
    container.appendChild(box);

    box.addEventListener('mouseenter', () => {
      setIsHovered(true);
    });

    box.addEventListener('mouseleave', () => {
      setIsHovered(false);
    });

    expect(isHovered()).toBe(false);

    // Mouseenter 이벤트
    const enterEvent = new MouseEvent('mouseenter', { bubbles: false });
    box.dispatchEvent(enterEvent);

    expect(isHovered()).toBe(true);

    // Mouseleave 이벤트
    const leaveEvent = new MouseEvent('mouseleave', { bubbles: false });
    box.dispatchEvent(leaveEvent);

    expect(isHovered()).toBe(false);
  });
});
