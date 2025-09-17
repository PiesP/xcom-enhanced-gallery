/**
 * P4.9.b: Twitter container capture should not consume gallery-internal wheel
 * - When a wheel occurs inside the gallery container while scrolling,
 *   the twitter-container capture listener must NOT preventDefault/stopPropagation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { h } from 'preact';
import { useState } from 'preact/hooks';

import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import * as coreUtils from '@/shared/utils/core-utils';
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

function Harness({ setContainer }: { setContainer: (el: HTMLElement | null) => void }) {
  // keep the hook active when container changes
  const [container, _setContainer] = useState<HTMLElement | null>(null);
  useGalleryScroll({
    container,
    enabled: true,
    blockTwitterScroll: true,
    onScroll: () => {},
  });
  return h(
    'div',
    { 'data-testid': 'gallery', ref: (el: HTMLElement | null) => _setContainer(el) },
    h('div', { 'data-testid': 'inner' })
  );
}

describe('P4.9.b: twitter container capture must not consume gallery-internal wheel', () => {
  let twitterContainer: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    twitterContainer = document.createElement('div');
    twitterContainer.setAttribute('data-testid', 'twitter-container');
    document.body.appendChild(twitterContainer);
    // Spy findTwitterScrollContainer to return our container
    vi.spyOn(coreUtils, 'findTwitterScrollContainer').mockReturnValue(twitterContainer);
    openGallery([]);
  });

  afterEach(() => {
    cleanup();
    closeGallery();
    try {
      twitterContainer.remove();
    } catch (e) {
      // ignore
    }
    vi.restoreAllMocks();
  });

  it('does NOT consume wheel events inside gallery when twitter container capture is active', async () => {
    // Render harness inside the twitter container so its capture listener sees the event
    const setContainer = (_el: HTMLElement | null) => {};
    render(h(Harness as any, { setContainer }), { container: twitterContainer });

    const inner = await screen.findByTestId('inner');

    // Fire wheel inside the gallery during open state
    const { preventSpy, stopSpy } = fireWheelOn(inner);

    expect(preventSpy).not.toHaveBeenCalled();
    expect(stopSpy).not.toHaveBeenCalled();
  });
});
