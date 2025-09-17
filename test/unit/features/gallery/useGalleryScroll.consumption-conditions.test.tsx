/**
 * P4.9: useGalleryScroll — wheel consumption conditions
 * - When gallery is open and event.target is inside the provided container, handler should NOT consume (no preventDefault/stopPropagation)
 * - When gallery is open and target is outside, handler SHOULD consume
 * - When gallery is closed, handler should NOT consume regardless of target
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';

function fireWheelOn(target: Element, deltaY = 40) {
  const ev = new globalThis.WheelEvent('wheel', {
    deltaY,
    cancelable: true,
    bubbles: true,
  });
  const preventSpy = vi.spyOn(ev, 'preventDefault');
  const stopSpy = vi.spyOn(ev, 'stopPropagation');
  const dispatched = target.dispatchEvent(ev);
  return { ev, preventSpy, stopSpy, dispatched };
}

describe('P4.9: useGalleryScroll — wheel consumption conditions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Ensure gallery is closed between tests
    closeGallery();
  });

  function Harness() {
    const [container, setContainer] = useState<HTMLElement | null>(null);
    // keep the hook active when container changes
    useGalleryScroll({
      container,
      enabled: true,
      blockTwitterScroll: true,
      onScroll: () => {},
    });
    return h(
      'div',
      { 'data-testid': 'root' },
      h(
        'div',
        { 'data-testid': 'gallery', ref: (el: HTMLElement | null) => setContainer(el) },
        h('div', { 'data-testid': 'inner' })
      )
    );
  }

  it('does NOT consume when target is inside gallery container (open)', async () => {
    openGallery([]);
    render(h(Harness as any, {}));

    const inner = await screen.findByTestId('inner');
    const { preventSpy, stopSpy } = fireWheelOn(inner);

    expect(preventSpy).not.toHaveBeenCalled();
    expect(stopSpy).not.toHaveBeenCalled();
  });

  it('consumes when target is outside gallery container (open)', async () => {
    openGallery([]);
    render(h(Harness as any, {}));

    const root = await screen.findByTestId('root');
    const { preventSpy, stopSpy } = fireWheelOn(root);

    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });

  it('does NOT consume when gallery is closed', async () => {
    closeGallery();
    render(h(Harness as any, {}));

    const root = await screen.findByTestId('root');
    const { preventSpy, stopSpy } = fireWheelOn(root);

    expect(preventSpy).not.toHaveBeenCalled();
    expect(stopSpy).not.toHaveBeenCalled();
  });
});
