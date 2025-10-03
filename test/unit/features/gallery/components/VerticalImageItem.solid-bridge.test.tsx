/* eslint-env browser */
/**
 * @file VerticalImageItem Solid bridge integration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { h, render } from '@test-utils/legacy-preact';
import { act } from '@test-utils/testing-library';
import { VerticalImageItem } from '@/features/gallery/components/vertical-gallery-view/VerticalImageItem';

describe('VerticalImageItem Solid bridge', () => {
  let container: globalThis.HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    render(null, container);
    container.remove();
  });

  it('renders media element and forwards load events to onMediaLoad', async () => {
    const onMediaLoad = vi.fn();

    await act(async () => {
      render(
        h(VerticalImageItem as any, {
          media: {
            id: 'media-1',
            url: 'https://example.com/media.jpg',
            type: 'image',
            filename: 'media.jpg',
          },
          index: 0,
          isActive: true,
          onMediaLoad,
        }),
        container
      );
      await Promise.resolve();
    });

    const media = container.querySelector('img');
    expect(media).not.toBeNull();

    media!.dispatchEvent(new Event('load'));

    expect(onMediaLoad).toHaveBeenCalledWith('https://example.com/media.jpg', 0);
  });

  it('renders media element and forwards context menu events to onImageContextMenu', async () => {
    const onImageContextMenu = vi.fn();

    await act(async () => {
      render(
        h(VerticalImageItem as any, {
          media: {
            id: 'media-2',
            url: 'https://example.com/media.mp4',
            type: 'video',
            filename: 'media.mp4',
          },
          index: 1,
          isActive: false,
          onImageContextMenu,
        }),
        container
      );
      await Promise.resolve();
    });

    const itemContainer = container.querySelector('[data-xeg-component="vertical-image-item"]');
    expect(itemContainer).not.toBeNull();

    itemContainer!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    expect(onImageContextMenu).toHaveBeenCalledTimes(1);
  });

  it('does not render metadata section (data-role="metadata")', async () => {
    await act(async () => {
      render(
        h(VerticalImageItem as any, {
          media: {
            id: 'media-3',
            url: 'https://example.com/media.png',
            type: 'image',
            filename: 'test-image.png',
          },
          index: 2,
          isActive: true,
        }),
        container
      );
      await Promise.resolve();
    });

    const metadata = container.querySelector('[data-role="metadata"]');
    expect(metadata).toBeNull();
  });
});
