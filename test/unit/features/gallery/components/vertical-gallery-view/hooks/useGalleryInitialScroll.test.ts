import { createRoot, createSignal } from 'solid-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGalleryInitialScroll } from '../../../../../../../src/features/gallery/components/vertical-gallery-view/hooks/useGalleryInitialScroll';

// Mock dependencies
vi.mock('@shared/external/vendors', async () => {
  const solid = await vi.importActual<typeof import('solid-js')>('solid-js');
  return {
    getSolid: () => solid,
  };
});

vi.mock('@shared/utils/time/timer-management', () => ({
  globalTimerManager: {
    setTimeout: (cb: Function, ms: number) => setTimeout(cb, ms),
    clearTimeout: (id: any) => clearTimeout(id),
    setInterval: (cb: Function, ms: number) => setInterval(cb, ms),
    clearInterval: (id: any) => clearInterval(id),
  },
}));

describe('useGalleryInitialScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should scroll to initial index when visible', async () => {
    await createRoot(async dispose => {
      const [isVisible, setIsVisible] = createSignal(false);
      const [containerEl, setContainerEl] = createSignal<HTMLElement | null>(null);
      const [mediaItems, setMediaItems] = createSignal<any[]>([]);
      const [currentIndex, setCurrentIndex] = createSignal(0);

      const scrollToItem = vi.fn().mockResolvedValue(undefined);
      const applyFocusAfterNavigation = vi.fn();

      const container = document.createElement('div');
      const list = document.createElement('div');
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);

      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      item.setAttribute('data-item-index', '0');
      // Mark as loaded to avoid waiting
      item.setAttribute('data-media-loaded', 'true');
      list.appendChild(item);

      setContainerEl(container);
      setMediaItems([{ url: 'test.jpg' }]);
      setCurrentIndex(0);

      useGalleryInitialScroll({
        isVisible,
        containerEl,
        mediaItems,
        currentIndex,
        scrollToItem,
        applyFocusAfterNavigation,
      });

      // Initially not visible, should not scroll
      expect(scrollToItem).not.toHaveBeenCalled();

      // Make it visible
      setIsVisible(true);

      // Wait for effects
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      // Should scroll immediately
      expect(scrollToItem).toHaveBeenCalledWith(0);
      expect(applyFocusAfterNavigation).toHaveBeenCalledWith(0);

      dispose();
    });
  });

  it('should not scroll if current index is invalid (< 0)', async () => {
    await createRoot(async dispose => {
      const [isVisible] = createSignal(true);

      const container = document.createElement('div');
      const list = document.createElement('div');
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);
      const item = document.createElement('div');
      item.setAttribute('data-xeg-role', 'gallery-item');
      list.appendChild(item);

      const [containerEl] = createSignal<HTMLElement | null>(container);
      const [mediaItems] = createSignal<any[]>([{ url: 'test' }]);
      const [currentIndex] = createSignal(-1);

      const scrollToItem = vi.fn();
      const applyFocusAfterNavigation = vi.fn();

      useGalleryInitialScroll({
        isVisible,
        containerEl,
        mediaItems,
        currentIndex,
        scrollToItem,
        applyFocusAfterNavigation,
      });

      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      expect(scrollToItem).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should only scroll once', async () => {
    await createRoot(async dispose => {
      const [isVisible, setIsVisible] = createSignal(true);

      const container = document.createElement('div');
      const list = document.createElement('div');
      list.setAttribute('data-xeg-role', 'items-list');
      container.appendChild(list);

      // Add items
      const item1 = document.createElement('div');
      item1.setAttribute('data-xeg-role', 'gallery-item');
      item1.setAttribute('data-item-index', '0');
      list.appendChild(item1);

      const item2 = document.createElement('div');
      item2.setAttribute('data-xeg-role', 'gallery-item');
      item2.setAttribute('data-item-index', '1');
      item2.setAttribute('data-media-loaded', 'true');
      list.appendChild(item2);

      const [containerEl] = createSignal<HTMLElement | null>(container);
      const [mediaItems] = createSignal<any[]>([{ url: '1' }, { url: '2' }]);
      const [currentIndex] = createSignal(1);

      const scrollToItem = vi.fn();
      const applyFocusAfterNavigation = vi.fn();

      useGalleryInitialScroll({
        isVisible,
        containerEl,
        mediaItems,
        currentIndex,
        scrollToItem,
        applyFocusAfterNavigation,
      });

      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      expect(scrollToItem).toHaveBeenCalledTimes(1);

      // Toggle visibility
      setIsVisible(false);
      await Promise.resolve();
      setIsVisible(true);
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(100);

      // Should scroll again because visibility toggle resets the flag
      expect(scrollToItem).toHaveBeenCalledTimes(2);

      dispose();
    });
  });
});
