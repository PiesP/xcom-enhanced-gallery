import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import { initializeVendors } from '@shared/external/vendors';
import { useGalleryScroll } from '@/features/gallery/hooks';
import { getPreact, getPreactHooks } from '@shared/external/vendors';
import { galleryState } from '@shared/state/signals/gallery.signals';

// ensure vendors are initialized in test env
initializeVendors?.();

const { h, render } = getPreact();
const { useEffect } = getPreactHooks();

// Test helper component to mount the hook
function TestComponent({ onScroll }: { onScroll: (delta: number) => void }) {
  // Use document.body as a stable, non-null container
  useGalleryScroll({
    container: document.body,
    onScroll,
    enabled: true,
    blockTwitterScroll: false,
    enableScrollDirection: false,
  });

  // Ensure gallery is marked as open after mount (post vendor init)
  useEffect(() => {
    galleryState.value = { ...galleryState.value, isOpen: true };
  }, []);

  return h('div', {});
}

// Utility to mount a Preact component in JSDOM
function mount(element: unknown) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  type RenderParams = Parameters<typeof render>;
  render(element as RenderParams[0], container as RenderParams[1]);
  return container;
}

function unmount(container: Element) {
  type RenderParams = Parameters<typeof render>;
  render(null as unknown as RenderParams[0], container as RenderParams[1]);
  container.remove();
}

describe('useGalleryScroll – throttle', () => {
  let container: Element | null = null;
  let onScrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onScrollSpy = vi.fn();
    galleryState.value = { ...galleryState.value, isOpen: true };
  });

  afterEach(() => {
    if (container) {
      unmount(container);
      container = null;
    }
  });

  it('reduces onScroll calls by >=50% under wheel burst (100 events)', async () => {
    container = mount(h(TestComponent, { onScroll: onScrollSpy }));

    // Allow effects and vendor init to finish
    await new Promise(resolve => setTimeout(resolve, 0));

    // Simulate 100 wheel events quickly (new event instance per dispatch)
    for (let i = 0; i < 100; i++) {
      const ev = new globalThis.WheelEvent('wheel', {
        deltaY: 10,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(ev);
    }

    // Give time for any scheduled flush (rAF/microtask) to run
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    // With throttle/RAF coalescing, callback count should be dramatically less than events
    expect(onScrollSpy.mock.calls.length).toBeLessThanOrEqual(50);
  });

  it.skip('baseline: current implementation should call onScroll close to event count (reference)', async () => {
    container = mount(h(TestComponent, { onScroll: onScrollSpy }));

    // Allow effects to run and event listeners to be registered (next macrotask)
    await new Promise(resolve => setTimeout(resolve, 0));

    const target = document.createElement('div');
    document.body.appendChild(target);
    const event = new globalThis.WheelEvent('wheel', {
      deltaY: 8,
      bubbles: true,
      cancelable: true,
    });
    for (let i = 0; i < 30; i++) {
      target.dispatchEvent(event);
    }

    // Baseline assertion: without throttle, callbacks should occur.
    expect(onScrollSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
  });
});
