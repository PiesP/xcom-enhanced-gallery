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

function createGalleryElements(): {
  galleryContainer: HTMLElement;
  itemsContainer: HTMLElement;
} {
  const galleryContainer = document.createElement('div');
  galleryContainer.setAttribute('data-gallery-element', 'gallery-root');

  const itemsContainer = document.createElement('div');
  itemsContainer.setAttribute('data-gallery-element', 'items-list');

  galleryContainer.appendChild(itemsContainer);
  document.body.appendChild(galleryContainer);

  return { galleryContainer, itemsContainer };
}

describe('useGalleryScroll – internal scroll management', () => {
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

  it('updates scroll state for gallery wheel events', () => {
    const { galleryContainer, itemsContainer } = createGalleryElements();

    let hookState!: ReturnType<typeof useGalleryScroll>;
    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
      });
      return hookState;
    });

    vi.setSystemTime(1_000);
    const internalEvent = createWheelEvent(120);
    const dispatchResult = itemsContainer.dispatchEvent(internalEvent);

    expect(dispatchResult).toBe(true);
    expect(internalEvent.defaultPrevented).toBe(false);
    expect(hookState.state().lastDelta).toBe(120);
    expect(hookState.lastScrollTime()).toBe(1_000);
    expect(hookState.isScrolling()).toBe(true);
  });

  it('resets scrolling flag after idle timeout', () => {
    const { galleryContainer, itemsContainer } = createGalleryElements();

    let hookState!: ReturnType<typeof useGalleryScroll>;
    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
      });
      return hookState;
    });

    vi.setSystemTime(500);
    itemsContainer.dispatchEvent(createWheelEvent(60));

    expect(hookState.isScrolling()).toBe(true);

    vi.advanceTimersByTime(SCROLL_IDLE_TIMEOUT + 1);
    expect(hookState.isScrolling()).toBe(false);
  });

  it('invokes onScroll callback with delta and target', () => {
    const { galleryContainer, itemsContainer } = createGalleryElements();
    const onScroll = vi.fn();

    let hookState!: ReturnType<typeof useGalleryScroll>;
    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
        onScroll,
      });
      return hookState;
    });

    itemsContainer.dispatchEvent(createWheelEvent(90));

    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScroll).toHaveBeenCalledWith(90, itemsContainer);
    expect(hookState.state().lastDelta).toBe(90);
  });

  it('ignores wheel events when gallery is closed', () => {
    const { galleryContainer, itemsContainer } = createGalleryElements();

    let hookState!: ReturnType<typeof useGalleryScroll>;
    createRoot(dispose => {
      disposeHook = dispose;
      hookState = useGalleryScroll({
        container: () => galleryContainer,
        scrollTarget: () => itemsContainer,
        enabled: () => true,
      });
      return hookState;
    });

    galleryState.value = {
      ...galleryState.value,
      isOpen: false,
    };

    itemsContainer.dispatchEvent(createWheelEvent(45));

    expect(hookState.state().lastDelta).toBe(0);
    expect(hookState.isScrolling()).toBe(false);
  });
});
