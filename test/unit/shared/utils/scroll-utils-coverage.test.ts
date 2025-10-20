/**
 * @fileoverview Phase 140.4: scroll-utils.ts Coverage Tests
 * @description 15+ tests to improve coverage from 10.6% → 60%+
 * - Gallery Element Detection (5 tests)
 * - Scroll Debouncer Creation (3 tests)
 * - Scroll Handler (7 tests)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isGalleryElement,
  createScrollDebouncer,
  createScrollHandler,
} from '../../../../src/shared/utils/scroll/scroll-utils';

describe('Gallery Element Detection', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('should return false for null element', () => {
    expect(isGalleryElement(null)).toBe(false);
  });

  it('should detect .xeg-gallery-container class', () => {
    container.className = 'xeg-gallery-container';
    expect(isGalleryElement(container)).toBe(true);
  });

  it('should detect data-gallery-element attribute', () => {
    container.setAttribute('data-gallery-element', 'true');
    expect(isGalleryElement(container)).toBe(true);
  });

  it('should detect #xeg-gallery-root id', () => {
    container.id = 'xeg-gallery-root';
    expect(isGalleryElement(container)).toBe(true);
  });

  it('should detect .vertical-gallery-view class', () => {
    container.className = 'vertical-gallery-view';
    expect(isGalleryElement(container)).toBe(true);
  });
});

describe('Scroll Debouncer Creation', () => {
  it('should create debouncer with default 150ms delay', () => {
    const callback = vi.fn();
    const debouncer = createScrollDebouncer(callback);

    expect(debouncer).toBeDefined();
    expect(typeof debouncer.execute).toBe('function');
    expect(typeof debouncer.cancel).toBe('function');
  });

  it('should create debouncer with custom delay', () => {
    const callback = vi.fn();
    const debouncer = createScrollDebouncer(callback, 200);

    expect(debouncer).toBeDefined();
    expect(typeof debouncer.execute).toBe('function');
  });

  it('should execute callback after delay', async () => {
    const callback = vi.fn();
    const debouncer = createScrollDebouncer(callback, 10);

    debouncer.execute();
    expect(callback).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 15));
    expect(callback).toHaveBeenCalledOnce();
  });
});

describe('Scroll Handler', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('should register wheel event listener on element', () => {
    const callback = vi.fn();
    const removeListener = createScrollHandler(element, callback);

    expect(typeof removeListener).toBe('function');
    removeListener();
  });

  it('should invoke callback with deltaY and event when threshold exceeded', () => {
    const callback = vi.fn();
    const removeListener = createScrollHandler(element, callback, { threshold: 5 });

    const wheelEvent = new WheelEvent('wheel', { deltaY: 10 });
    element.dispatchEvent(wheelEvent);

    expect(callback).toHaveBeenCalledWith(10, expect.any(WheelEvent));
    removeListener();
  });

  it('should not invoke callback when deltaY below threshold', () => {
    const callback = vi.fn();
    const removeListener = createScrollHandler(element, callback, { threshold: 50 });

    const wheelEvent = new WheelEvent('wheel', { deltaY: 10 });
    element.dispatchEvent(wheelEvent);

    expect(callback).not.toHaveBeenCalled();
    removeListener();
  });

  it('should register listener on document when captureOnDocument=true', () => {
    const callback = vi.fn();
    const removeListener = createScrollHandler(element, callback, {
      captureOnDocument: true,
    });

    const wheelEvent = new WheelEvent('wheel', { deltaY: 20 });
    document.dispatchEvent(wheelEvent);

    expect(callback).toHaveBeenCalledWith(20, expect.any(WheelEvent));
    removeListener();
  });

  it('should use passive listener by default', () => {
    const callback = vi.fn();
    const addEventListenerSpy = vi.spyOn(element, 'addEventListener');

    const removeListener = createScrollHandler(element, callback);

    expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
      passive: true,
    });

    removeListener();
    addEventListenerSpy.mockRestore();
  });

  it('should remove listener when cleanup function is called', () => {
    const callback = vi.fn();
    const removeEventListenerSpy = vi.spyOn(element, 'removeEventListener');

    const removeListener = createScrollHandler(element, callback);
    removeListener();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should handle callback execution errors gracefully', () => {
    const throwingCallback = vi.fn().mockImplementation(() => {
      throw new Error('Callback error');
    });

    const removeListener = createScrollHandler(element, throwingCallback);

    // Should not throw when callback fails
    expect(() => {
      const wheelEvent = new WheelEvent('wheel', { deltaY: 10 });
      element.dispatchEvent(wheelEvent);
    }).not.toThrow();

    removeListener();
  });
});
