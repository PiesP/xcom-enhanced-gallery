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

  it('invokes onDownload when download button is clicked', async () => {
    const onDownload = vi.fn();

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
          onDownload,
        }),
        container
      );
      await Promise.resolve();
    });

    const downloadButton = container.querySelector('[data-role="download"]');
    expect(downloadButton).not.toBeNull();

    downloadButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
