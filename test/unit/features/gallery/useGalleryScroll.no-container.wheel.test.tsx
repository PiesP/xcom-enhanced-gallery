/**
 * P4.7: useGalleryScroll — wheel works without container
 * - When enabled=true and container=null, document-level wheel listener should register
 * - Handler should run on wheel and be able to preventDefault when gallery is open
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/preact';
import { h } from 'preact';

import { useGalleryScroll } from '@/features/gallery/hooks/useGalleryScroll';
import { openGallery } from '@/shared/state/signals/gallery.signals';

function fireWheel(deltaY: number) {
  const ev = new globalThis.WheelEvent('wheel', { deltaY, cancelable: true, bubbles: true });
  const preventSpy = vi.spyOn(ev, 'preventDefault');
  const stopSpy = vi.spyOn(ev, 'stopPropagation');
  const dispatched = document.dispatchEvent(ev);
  return { ev, preventSpy, stopSpy, dispatched };
}

describe('P4.7: useGalleryScroll — works without container', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addSpy = vi.spyOn(document, 'addEventListener');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function Harness() {
    useGalleryScroll({ container: null, enabled: true, onScroll: () => {} });
    return null as any;
  }

  it('registers document wheel and handles event when container is null', async () => {
    // Open the gallery so handler path is active
    openGallery([]);

    render(h(Harness as any, {}));

    // Document-level wheel listener should have been registered
    expect(addSpy).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.objectContaining({ capture: true, passive: false })
    );

    const { preventSpy, stopSpy } = fireWheel(40);

    // In JSDOM, dispatchEvent may return false when default is prevented; rely on spies instead
    expect(preventSpy).toHaveBeenCalled();
    expect(stopSpy).toHaveBeenCalled();
  });
});
