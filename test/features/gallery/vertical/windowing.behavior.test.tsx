/**
 * @file windowing.behavior.test.tsx
 * @description Simple windowing (viewport ±N) behavior tests for VerticalGalleryView (TDD: RED → GREEN)
 */
import { describe, it, expect } from 'vitest';
import { getPreact } from '@/shared/external/vendors';
import { openGallery, closeGallery } from '@/shared/state/signals/gallery.signals';
import { VerticalGalleryView } from '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView';

const { h, render } = getPreact();

describe('VerticalGalleryView • simple windowing around current index', () => {
  it('renders only items within ±N by default and uses placeholders for others', async () => {
    const host = document.createElement('div');
    const N = 5; // default window size expectation

    // Prepare 100 items and open gallery at the middle index
    const items = Array.from({ length: 100 }).map((_, i) => ({
      id: `id-${i}`,
      url: `https://example.com/u${i}.jpg`,
      type: 'image' as const,
      filename: `u${i}.jpg`,
    }));
    const currentIndex = 50;
    openGallery(items, currentIndex);

    // Render view with defaults (windowing enabled by default)
    render(
      h(VerticalGalleryView as any, {
        className: 'test-view',
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
      }),
      host
    );

    const itemsContainer = host.querySelector('[data-xeg-role="items-container"]') as HTMLElement;
    expect(itemsContainer).toBeTruthy();

    // Real rendered items should be limited to ±N around currentIndex
    const realItems = itemsContainer.querySelectorAll('[data-xeg-role="gallery-item"]');
    expect(realItems.length).toBe(2 * N + 1); // 11 items (indices 45..55)

    // Placeholders should exist for non-windowed indices
    const placeholders = itemsContainer.querySelectorAll(
      '[data-xeg-role="gallery-item-placeholder"]'
    );
    expect(placeholders.length).toBe(items.length - realItems.length);

    // Children count should remain equal to the total items for index-based scroll compatibility
    expect(itemsContainer.children.length).toBe(items.length);

    // The current item must be among the real rendered items
    const currentEl = itemsContainer.querySelector(
      `[data-xeg-role="gallery-item"][data-index="${currentIndex}"]`
    );
    expect(currentEl).toBeTruthy();

    // Rerender with windowing explicitly disabled → all real items must be rendered and no placeholders
    render(
      h(VerticalGalleryView as any, {
        className: 'test-view',
        onDownloadCurrent: () => {},
        onDownloadAll: () => {},
        windowingEnabled: false,
      }),
      host
    );

    const allRealItems = itemsContainer.querySelectorAll('[data-xeg-role="gallery-item"]');
    const allPlaceholders = itemsContainer.querySelectorAll(
      '[data-xeg-role="gallery-item-placeholder"]'
    );
    expect(allRealItems.length).toBe(items.length);
    expect(allPlaceholders.length).toBe(0);

    // Cleanup
    render(null as unknown as any, host);
    closeGallery();
  });
});
