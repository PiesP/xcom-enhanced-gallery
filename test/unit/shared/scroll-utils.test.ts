import { expect } from 'vitest';
import {
  isGalleryElement,
  preventScrollPropagation,
  createScrollHandler,
} from '@shared/utils/scroll/scroll-utils';

describe('scroll-utils', () => {
  test('isGalleryElement returns true for matching selector', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    el.classList.add('xeg-gallery-container');
    doc.body.appendChild(el);
    expect(isGalleryElement(el)).toBe(true);
    el.remove();
  });

  test('preventScrollPropagation adds and removes wheel listener', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    doc.body.appendChild(el);
    const cleanup = preventScrollPropagation(el, { disableBodyScroll: false });
    // dispatch a WheelEvent to ensure handler runs without throwing
    const EvCtor = globalThis.WheelEvent || globalThis.Event;
    const ev = new EvCtor('wheel', { deltaY: 10 });
    el.dispatchEvent(ev);
    cleanup();
    el.remove();
  });

  test('createScrollHandler registers and removes listener', () => {
    const doc = globalThis.document;
    const el = doc.createElement('div');
    let called = false;
    const cleanup = createScrollHandler(
      el,
      deltaY => {
        called = true;
        expect(deltaY).toBeGreaterThan(0);
      },
      { threshold: 0 }
    );

    // simulate a wheel event
    const EvCtor2 = globalThis.WheelEvent || globalThis.Event;
    const ev2 = new EvCtor2('wheel', { deltaY: 5 });
    el.dispatchEvent(ev2);
    cleanup();
    expect(called).toBe(true);
  });
});
