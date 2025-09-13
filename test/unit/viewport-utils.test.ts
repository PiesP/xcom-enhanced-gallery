/* @vitest-environment jsdom */
/* eslint-env browser, es2021 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeViewportConstraints,
  applyViewportCssVars,
  observeViewportCssVars,
} from '@/shared/utils/viewport';

function makeRect(width: number, height: number) {
  return { width, height };
}

describe('viewport utils', () => {
  beforeEach(() => {
    // jsdom defaults ok
  });

  it('computeViewportConstraints: basic subtraction and flooring', () => {
    const v = computeViewportConstraints(makeRect(1024.9, 768.2), {
      toolbarHeight: 50.7,
      paddingTop: 10.2,
      paddingBottom: 5.9,
    });
    expect(v.viewportW).toBe(1024);
    expect(v.viewportH).toBe(768);
    expect(v.constrainedH).toBe(768 - 50 - 10 - 5);
  });

  it('computeViewportConstraints: non-negative results', () => {
    const v = computeViewportConstraints(makeRect(0, 10), { toolbarHeight: 999 });
    expect(v.viewportW).toBe(0);
    expect(v.viewportH).toBe(10);
    expect(v.constrainedH).toBe(0);
  });

  it('applyViewportCssVars: sets CSS variables in px', () => {
    const el = document.createElement('div');
    applyViewportCssVars(el, { viewportW: 100, viewportH: 200, constrainedH: 150 });
    expect(el.style.getPropertyValue('--xeg-viewport-w')).toBe('100px');
    expect(el.style.getPropertyValue('--xeg-viewport-h')).toBe('200px');
    expect(el.style.getPropertyValue('--xeg-viewport-height-constrained')).toBe('150px');
  });

  it('observeViewportCssVars: applies and cleans up listeners', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.getBoundingClientRect = () => ({
      width: 300,
      height: 400,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const getChrome = () => ({ toolbarHeight: 20, paddingTop: 10, paddingBottom: 5 });

    const removeListener = vi.spyOn(window, 'removeEventListener');

    const cleanup = observeViewportCssVars(el, getChrome);

    // initial application
    expect(el.style.getPropertyValue('--xeg-viewport-height-constrained')).toBe('365px');

    // trigger resize
    window.dispatchEvent(new Event('resize'));

    // microtask to allow raf(0) fallback timers
    await new Promise(r => setTimeout(r, 0));

    expect(el.style.getPropertyValue('--xeg-viewport-height-constrained')).toBe('365px');

    // cleanup removes listeners
    cleanup();
    expect(removeListener).toHaveBeenCalled();

    document.body.removeChild(el);
  });
});
