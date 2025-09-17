import { describe, expect, test } from 'vitest';
import { isEventInsideContainer } from '@/shared/dom/utils/dom-utils';

describe('isEventInsideContainer (Shadow DOM aware)', () => {
  test('returns false when missing inputs', () => {
    // @ts-expect-error — intentionally invalid
    expect(isEventInsideContainer(undefined, undefined)).toBe(false);
    expect(isEventInsideContainer(new (window as any).Event('wheel'), null as any)).toBe(false);
  });

  test('returns true when target is contained by container (light DOM)', () => {
    const container = document.createElement('div');
    const inner = document.createElement('div');
    container.appendChild(inner);

    const ev = new (window as any).Event('wheel', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'target', { value: inner });

    expect(isEventInsideContainer(ev, container)).toBe(true);
  });

  test('returns true when composedPath includes a node inside container (Shadow DOM retargeting)', () => {
    const container = document.createElement('div');

    // Shadow host inside container
    const host = document.createElement('div');
    container.appendChild(host);

    // Create shadow root and inner element
    const shadowRoot = (host as any).attachShadow
      ? (host as any).attachShadow({ mode: 'open' })
      : null;
    const inner = document.createElement('div');
    if (shadowRoot) shadowRoot.appendChild(inner);

    // Fake a wheel event with a composedPath that traverses from inner up to container
    const ev = new (window as any).Event('wheel', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'target', { value: inner });
    Object.defineProperty(ev, 'composedPath', {
      value: () => [inner, shadowRoot, host, container, document, window].filter(Boolean),
    });

    // Even if container.contains(inner) may be false due to shadow boundary, composedPath should make it true
    expect(isEventInsideContainer(ev as any, container)).toBe(true);
  });

  test('returns false for external event', () => {
    const container = document.createElement('div');
    const outside = document.createElement('div');

    const ev = new (window as any).Event('wheel', { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'target', { value: outside });
    Object.defineProperty(ev, 'composedPath', { value: () => [outside, document, window] });

    expect(isEventInsideContainer(ev as any, container)).toBe(false);
  });
});
