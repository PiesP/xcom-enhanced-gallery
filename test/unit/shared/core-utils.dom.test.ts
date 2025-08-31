import { describe, it, expect, beforeEach } from 'vitest';

import {
  findScrollContainer,
  findTwitterScrollContainer,
  safeSetScrollTop,
  getCurrentScrollTop,
  ensureGalleryScrollAvailable,
} from '../../../src/shared/utils/core-utils';

describe('core-utils DOM helpers', () => {
  beforeEach(() => {
    // reset document body
    const body = globalThis.document.body;
    body.innerHTML = '';
    // ensure documentElement scrollTop reset
    globalThis.document.documentElement.scrollTop = 0;
  });

  it('findScrollContainer returns nearest scrollable parent', () => {
    const parent = globalThis.document.createElement('div');
    parent.style.overflow = 'auto';
    const child = globalThis.document.createElement('div');
    parent.appendChild(child);
    globalThis.document.body.appendChild(parent);

    const found = findScrollContainer(child);
    expect(found).toBe(parent);
  });

  it('findTwitterScrollContainer finds known selectors', () => {
    const main = globalThis.document.createElement('main');
    main.setAttribute('role', 'main');
    globalThis.document.body.appendChild(main);

    const found = findTwitterScrollContainer();
    expect(found).toBe(main);
  });

  it('safeSetScrollTop sets element scrollTop and handles window', () => {
    const el = globalThis.document.createElement('div');
    globalThis.document.body.appendChild(el);
    safeSetScrollTop(el, 123);
    expect(el.scrollTop).toBe(123);

    // window variant should not throw
    expect(() => safeSetScrollTop(globalThis.window, 10)).not.toThrow();
  });

  it('getCurrentScrollTop returns element or window scroll position', () => {
    const el = globalThis.document.createElement('div');
    el.scrollTop = 55;
    expect(getCurrentScrollTop(el)).toBe(55);

    // set documentElement scrollTop for window
    globalThis.document.documentElement.scrollTop = 77;
    expect(getCurrentScrollTop(globalThis.window)).toBe(77);
  });

  it('ensureGalleryScrollAvailable sets overflowY to auto for items', () => {
    const container = globalThis.document.createElement('div');
    const list = globalThis.document.createElement('div');
    list.setAttribute('data-xeg-role', 'items-list');
    list.style.overflowY = '';
    container.appendChild(list);
    globalThis.document.body.appendChild(container);

    ensureGalleryScrollAvailable(container);
    expect(list.style.overflowY).toBe('auto');
  });
});
