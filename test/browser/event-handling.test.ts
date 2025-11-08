/**
 * Event Handling (Browser Mode)
 *
 * **Purpose**: Verify PC-only event handling in real browser.
 * Tests click, keyboard, wheel, delegation, preventDefault, stopPropagation.
 *
 * **PC-Only Events**: click, keydown/up, wheel, contextmenu, mouse*
 * **Forbidden**: touch, pointer events (userscript policy)
 *
 * @see docs/CODING_GUIDELINES.md#pc-events-only
 * @see TESTING_STRATEGY.md#browser-tests
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { getSolid } from '@shared/external/vendors';

const { createSignal } = getSolid();

describe('Event Handling (Browser)', () => {
  setupGlobalTestIsolation();

  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should handle click events correctly', () => {
    const [clicked, setClicked] = createSignal(false);
    const button = document.createElement('button');
    button.textContent = 'Click';
    container.appendChild(button);

    button.addEventListener('click', () => setClicked(true));
    expect(clicked()).toBe(false);

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
    const [clickedId, setClickedId] = createSignal('');

    const list = document.createElement('ul');
    list.innerHTML = `
      <li data-id="item-1">Item 1</li>
      <li data-id="item-2">Item 2</li>
      <li data-id="item-3">Item 3</li>
    `;
    container.appendChild(list);

    list.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'LI') {
        setClickedId(target.dataset.id || '');
      }
    });

    const item = list.querySelector('[data-id="item-2"]') as HTMLElement;
    item.click();

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(clickedId()).toBe('item-2');
  });

  it('should prevent default behavior when needed', () => {
    const link = document.createElement('a');
    link.href = 'https://example.com';
    link.textContent = 'Link';
    container.appendChild(link);

    let prevented = false;
    link.addEventListener('click', event => {
      event.preventDefault();
      prevented = event.defaultPrevented;
    });

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(clickEvent);

    expect(prevented).toBe(true);
  });

  it('should stop event propagation when needed', () => {
    const outer = document.createElement('div');
    const inner = document.createElement('button');
    inner.textContent = 'Button';

    outer.appendChild(inner);
    container.appendChild(outer);

    let outerClicked = false;
    let innerClicked = false;

    outer.addEventListener('click', () => {
      outerClicked = true;
    });

    inner.addEventListener('click', event => {
      innerClicked = true;
      event.stopPropagation();
    });

    inner.click();

    expect(innerClicked).toBe(true);
    expect(outerClicked).toBe(false);
  });

  it('should handle custom events', async () => {
    const [data, setData] = createSignal<{ value: number } | null>(null);

    const target = document.createElement('div');
    container.appendChild(target);

    target.addEventListener('customUpdate', ((event: CustomEvent) => {
      setData(event.detail);
    }) as EventListener);

    const event = new CustomEvent('customUpdate', {
      detail: { value: 42 },
      bubbles: true,
    });
    target.dispatchEvent(event);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(data()?.value).toBe(42);
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

    const wheelEvent = new WheelEvent('wheel', { deltaY: 100, bubbles: true });
    scrollable.dispatchEvent(wheelEvent);

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(deltaY()).toBe(100);
  });

  it('should handle mouseenter/mouseleave events', () => {
    const [isHovered, setIsHovered] = createSignal(false);

    const box = document.createElement('div');
    box.style.width = '100px';
    box.style.height = '100px';
    container.appendChild(box);

    box.addEventListener('mouseenter', () => setIsHovered(true));
    box.addEventListener('mouseleave', () => setIsHovered(false));

    expect(isHovered()).toBe(false);

    box.dispatchEvent(new MouseEvent('mouseenter', { bubbles: false }));
    expect(isHovered()).toBe(true);

    box.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
    expect(isHovered()).toBe(false);
  });
});
