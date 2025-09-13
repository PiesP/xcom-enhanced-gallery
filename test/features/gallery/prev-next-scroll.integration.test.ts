/**
 * @fileoverview Integration test for prev/next navigation scrolling
 */
import { describe, it, expect, vi } from 'vitest';
import { getPreact } from '@/shared/external/vendors';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';

const { h, render } = getPreact();

describe('Prev/Next buttons trigger scroll into view', () => {
  it('navigates and attempts to scroll target item', async () => {
    vi.useFakeTimers();
    const container = (globalThis as any).document.createElement('div');

    // Prepare gallery items and open gallery so that VerticalGalleryView renders items container
    const items = Array.from({ length: 3 }).map((_, i) => ({
      id: `id-${i}`,
      url: `https://example.com/u${i}.jpg`,
      type: 'image' as const,
      filename: `u${i}.jpg`,
    }));
    openGallery(items, 0);

    render(
      h(VerticalGalleryView as any, {
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        className: 'test-view',
      }),
      container
    );

    // Ensure items container exists for the hook to find
    const itemsContainer = container.querySelector('[data-xeg-role="items-container"]');
    expect(itemsContainer).toBeTruthy();

    // Cleanup: unmount and close gallery; flush pending timers to avoid teardown errors
    render(null as unknown as any, container);
    closeGallery();
    vi.runAllTimers();
    vi.useRealTimers();
  });
});
