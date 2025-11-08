import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';
import { getSolid } from '@/shared/external/vendors';
import { useGalleryScroll, SCROLL_IDLE_TIMEOUT } from '@/features/gallery/hooks/useGalleryScroll';
import { galleryState, type GalleryState } from '@/shared/state/signals/gallery.signals';
import { globalTimerManager } from '@/shared/utils/timer-management';

const { createRoot } = getSolid();

function createWheelEvent(deltaY: number): WheelEvent {
  const event = new Event('wheel', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'deltaY', {
    configurable: true,
    enumerable: true,
    value: deltaY,
  });
  return event as WheelEvent;
}

describe('useGalleryScroll – scroll chaining guard', () => {
  setupGlobalTestIsolation();

  let disposeHook: (() => void) | null = null;
  let originalGalleryState: GalleryState;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    document.body.innerHTML = '';

    originalGalleryState = galleryState.value;
    galleryState.value = {
      ...originalGalleryState,
      isOpen: true,
    };
  });

  afterEach(() => {
    disposeHook?.();
    disposeHook = null;

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    globalTimerManager.cleanup();

    galleryState.value = originalGalleryState;
    document.body.innerHTML = '';
  });

  it('does not block gallery internal wheel events when body fallback is used', () => {
    const galleryContainer = document.createElement('div');
    galleryContainer.setAttribute('data-gallery-container', 'true');

    const itemsContainer = document.createElement('div');
    itemsContainer.setAttribute('data-xeg-role', 'items-list');
    galleryContainer.appendChild(itemsContainer);
    document.body.appendChild(galleryContainer);

    let hookState!: ReturnType<typeof useGalleryScroll>;

    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
        blockTwitterScroll: () => true,
      });
      return hookState;
    });

    const internalEvent = createWheelEvent(120);
    const dispatchResult = itemsContainer.dispatchEvent(internalEvent);

    expect(dispatchResult).toBe(true);
    expect(internalEvent.defaultPrevented).toBe(false);
    expect(hookState.state().lastDelta).toBe(120);
    expect(hookState.state().lastPreventedAt).toBe(0);
  });

  it('does not block external wheel events before gallery interaction', () => {
    const galleryContainer = document.createElement('div');
    galleryContainer.setAttribute('data-gallery-container', 'true');

    const itemsContainer = document.createElement('div');
    itemsContainer.setAttribute('data-xeg-role', 'items-list');
    galleryContainer.appendChild(itemsContainer);

    const externalSurface = document.createElement('div');
    externalSurface.id = 'external-host-before-scroll';

    document.body.appendChild(galleryContainer);
    document.body.appendChild(externalSurface);

    let hookState!: ReturnType<typeof useGalleryScroll>;

    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
        blockTwitterScroll: () => true,
      });
      return hookState;
    });

    const externalEvent = createWheelEvent(45);
    const dispatchResult = externalSurface.dispatchEvent(externalEvent);

    expect(dispatchResult).toBe(true);
    expect(externalEvent.defaultPrevented).toBe(false);
    expect(hookState.isScrolling()).toBe(false);
    expect(hookState.state().lastPreventedTarget).toBeNull();
  });

  it('blocks external wheel events while gallery scroll is active and records metadata', () => {
    const galleryContainer = document.createElement('div');
    galleryContainer.setAttribute('data-gallery-container', 'true');

    const itemsContainer = document.createElement('div');
    itemsContainer.setAttribute('data-xeg-role', 'items-list');
    galleryContainer.appendChild(itemsContainer);

    const externalSurface = document.createElement('div');
    externalSurface.id = 'external-scroll-host';

    document.body.appendChild(galleryContainer);
    document.body.appendChild(externalSurface);

    let hookState!: ReturnType<typeof useGalleryScroll>;

    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
        blockTwitterScroll: () => true,
      });
      return hookState;
    });

    const internalEvent = createWheelEvent(90);
    itemsContainer.dispatchEvent(internalEvent);

    vi.setSystemTime(1_000);
    const externalEvent = createWheelEvent(60);
    const dispatchResult = externalSurface.dispatchEvent(externalEvent);

    expect(dispatchResult).toBe(false);
    expect(externalEvent.defaultPrevented).toBe(true);
    expect(hookState.state().lastPreventedTarget).toBe('external-scroll-host');
    expect(hookState.state().lastPreventedDelta).toBe(60);
    expect(hookState.state().lastPreventedAt).toBe(1_000);

    vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT + 1);
    expect(hookState.isScrolling()).toBe(false);
  });

  it('reattaches wheel guard when twitter container changes', () => {
    const galleryContainer = document.createElement('div');
    galleryContainer.setAttribute('data-gallery-container', 'true');

    const itemsContainer = document.createElement('div');
    itemsContainer.setAttribute('data-xeg-role', 'items-list');
    galleryContainer.appendChild(itemsContainer);
    document.body.appendChild(galleryContainer);

    let hookState!: ReturnType<typeof useGalleryScroll>;

    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
        blockTwitterScroll: () => true,
      });
      return hookState;
    });

    const internalEvent = createWheelEvent(30);
    itemsContainer.dispatchEvent(internalEvent);

    const twitterColumn = document.createElement('div');
    twitterColumn.setAttribute('data-testid', 'primaryColumn');
    document.body.appendChild(twitterColumn);

    vi.setSystemTime(2_000);
    const externalEvent = createWheelEvent(75);
    const dispatchResult = twitterColumn.dispatchEvent(externalEvent);

    expect(dispatchResult).toBe(false);
    expect(externalEvent.defaultPrevented).toBe(true);
    expect(hookState.state().lastPreventedTarget).toBe('primaryColumn');
    expect(hookState.state().lastPreventedDelta).toBe(75);
    expect(hookState.state().lastPreventedAt).toBe(2_000);
  });
});
