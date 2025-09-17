/**
 * useGalleryScroll — Integration tests
 * - Ensures document-level wheel listener only active when gallery is open
 * - Verifies preventDefault when open and no preventDefault when closed
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/preact';
import { h } from 'preact';

import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';
import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';

function dispatchWheel(
  target: HTMLElement | globalThis.Document,
  init: globalThis.WheelEventInit = {}
) {
  const wheel = new globalThis.WheelEvent('wheel', {
    bubbles: true,
    cancelable: true,
    deltaY: init.deltaY ?? 1,
  });
  return { wheel, dispatched: target.dispatchEvent(wheel) };
}

describe('useGalleryScroll — document-level wheel guard', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    cleanup();
    if (host && document.body.contains(host)) document.body.removeChild(host);
  });

  it('does not prevent document wheel when gallery is closed', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const Harness = () => {
      useGalleryScroll({ container, enabled: true, blockTwitterScroll: true });
      return null;
    };

    render(h(Harness, {}), { container: host });

    const { wheel, dispatched } = dispatchWheel(document);
    expect(dispatched).toBe(true);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('prevents document wheel while gallery is open, and stops after close', async () => {
    const container = document.createElement('div');
    // Simulate scrollable gallery container to avoid container-level wheel lock consuming events
    Object.defineProperty(container, 'clientHeight', { value: 400, configurable: true });
    Object.defineProperty(container, 'scrollHeight', { value: 2000, configurable: true });
    container.style.overflow = 'auto';

    const Harness = () => {
      useGalleryScroll({ container, enabled: true, blockTwitterScroll: true });
      return null;
    };

    render(h(Harness, {}), { container: host });

    // Open the gallery
    openGallery([], 0);
    // Allow effects to run
    await Promise.resolve();

    let r = dispatchWheel(document);
    expect(r.dispatched).toBe(false);
    expect(r.wheel.defaultPrevented).toBe(true);

    // Close the gallery
    closeGallery();
    await Promise.resolve();

    r = dispatchWheel(document);
    expect(r.dispatched).toBe(true);
    expect(r.wheel.defaultPrevented).toBe(false);
  });
});
