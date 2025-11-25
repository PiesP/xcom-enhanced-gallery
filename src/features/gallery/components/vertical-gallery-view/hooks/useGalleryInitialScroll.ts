import { getSolid } from '@shared/external/vendors';
import type { MediaInfo } from '@shared/types';
import { globalTimerManager } from '@shared/utils/time/timer-management';
import type { Accessor } from 'solid-js';

interface UseGalleryInitialScrollProps {
  isVisible: Accessor<boolean>;
  containerEl: Accessor<HTMLElement | null>;
  mediaItems: Accessor<readonly MediaInfo[]>;
  currentIndex: Accessor<number>;
  scrollToItem: (index: number) => Promise<void> | void;
  applyFocusAfterNavigation: (
    index: number,
    trigger: 'init',
    options?: { force?: boolean }
  ) => void;
}

export function useGalleryInitialScroll({
  isVisible,
  containerEl,
  mediaItems,
  currentIndex,
  scrollToItem,
  applyFocusAfterNavigation,
}: UseGalleryInitialScrollProps) {
  const { createEffect } = getSolid();
  let hasPerformedInitialScroll = false;

  const waitForMediaLoad = (element: Element, timeoutMs: number = 1000): Promise<void> => {
    return new Promise(resolve => {
      if (element.getAttribute('data-media-loaded') === 'true') {
        resolve();
        return;
      }

      const checkInterval = globalTimerManager.setInterval(() => {
        if (element.getAttribute('data-media-loaded') === 'true') {
          globalTimerManager.clearInterval(checkInterval);
          globalTimerManager.clearTimeout(timeoutId);
          resolve();
        }
      }, 50);

      const timeoutId = globalTimerManager.setTimeout(() => {
        globalTimerManager.clearInterval(checkInterval);
        resolve();
      }, timeoutMs);
    });
  };

  const autoScrollToCurrentItem = async () => {
    const currentIdx = currentIndex();
    const container = containerEl();

    if (!container || currentIdx < 0 || currentIdx >= mediaItems().length) {
      return;
    }

    const itemElement =
      container.querySelector(`[data-item-index="${currentIdx}"]`) ||
      container.querySelector(`[data-index="${currentIdx}"]`);

    if (itemElement) {
      await waitForMediaLoad(itemElement);
    }

    scrollToItem(currentIdx);
    applyFocusAfterNavigation(currentIdx, 'init', { force: true });
  };

  createEffect(() => {
    const visible = isVisible();

    if (!visible) {
      hasPerformedInitialScroll = false;
      return;
    }

    if (hasPerformedInitialScroll) return;

    const container = containerEl();
    const items = mediaItems();
    if (!container || items.length === 0) return;

    const itemsContainer = container.querySelector(
      '[data-xeg-role="items-list"], [data-xeg-role="items-container"]'
    );
    const galleryItems = itemsContainer?.querySelectorAll('[data-xeg-role="gallery-item"]');
    if (!itemsContainer || !galleryItems || galleryItems.length === 0) return;

    hasPerformedInitialScroll = true;

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(async () => {
          const currentIdx = currentIndex();
          if (currentIdx >= 0 && currentIdx < items.length) {
            const itemElement =
              container.querySelector(`[data-item-index="${currentIdx}"]`) ||
              container.querySelector(`[data-index="${currentIdx}"]`);

            if (itemElement) {
              await waitForMediaLoad(itemElement, 1000);
            }

            await scrollToItem(currentIdx);
            applyFocusAfterNavigation(currentIdx, 'init', { force: true });
          }
        });
      });
    } else {
      const currentIdx = currentIndex();
      if (currentIdx >= 0 && currentIdx < items.length) {
        const itemElement =
          container.querySelector(`[data-item-index="${currentIdx}"]`) ||
          container.querySelector(`[data-index="${currentIdx}"]`);

        if (itemElement) {
          void waitForMediaLoad(itemElement, 1000).then(async () => {
            scrollToItem(currentIdx);
            applyFocusAfterNavigation(currentIdx, 'init', { force: true });
          });
          return;
        }

        scrollToItem(currentIdx);
        applyFocusAfterNavigation(currentIdx, 'init', { force: true });
        return;
      }
    }
  });

  return { autoScrollToCurrentItem };
}
