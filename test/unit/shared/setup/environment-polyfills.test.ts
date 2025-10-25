import { describe, expect, it, vi } from 'vitest';

describe('environment polyfills', () => {
  it('provides IntersectionObserver entries with DOMRectReadOnly fields', () => {
    const callback = vi.fn();
    const observer = new window.IntersectionObserver(callback);
    const element = document.createElement('div');

    observer.observe(element);

    expect(callback).toHaveBeenCalledTimes(1);
    const entries = callback.mock.calls[0]?.[0] ?? [];
    const entry = entries[0];

    expect(entry).toBeDefined();
    expect(entry.boundingClientRect).toMatchObject({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(entry.intersectionRect).toMatchObject({
      right: 100,
      bottom: 100,
    });
    expect(entry.rootBounds).toMatchObject({
      right: 1000,
      bottom: 1000,
    });
    expect(typeof entry.boundingClientRect.toJSON()).toBe('object');
  });

  it('exposes matchMedia returning consistent object', () => {
    const query = '(prefers-reduced-motion: reduce)';
    const result = window.matchMedia(query);

    expect(result.matches).toBe(false);
    expect(result.media).toBe(query);
    expect(result.dispatchEvent(new window.Event('change'))).toBe(true);

    const listener = vi.fn();
    result.addListener(listener);
    result.removeListener(listener);
    result.addEventListener('change', listener);
    result.removeEventListener('change', listener);
    expect(listener).not.toHaveBeenCalled();
  });
});
