/**
 * @fileoverview VerticalImageItem 레이아웃 예약 동작 검증
 */

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, h } from '../../../../utils/testing-library';
import type { MediaInfo } from '../../../../../src/shared/types';
import { VerticalImageItem } from '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem';

const baseMedia: MediaInfo = {
  id: 'media-0',
  url: 'https://example.com/media.jpg',
  type: 'image',
  filename: 'media.jpg',
};

describe('VerticalImageItem – intrinsic sizing', () => {
  afterEach(() => {
    cleanup();
  });

  it('applies metadata-backed aspect ratio before image load', () => {
    const mediaWithDimensions: MediaInfo = {
      ...baseMedia,
      width: 1200,
      height: 800,
    };

    const { container } = render(
      h(VerticalImageItem, {
        media: mediaWithDimensions,
        index: 0,
        isActive: false,
        forceVisible: true,
        onClick: () => {},
        fitMode: 'fitWidth',
      })
    );

    const item = container.querySelector('[data-index="0"]') as HTMLDivElement | null;
    expect(item).not.toBeNull();
    expect(item?.dataset.hasIntrinsicSize).toBe('true');
    expect(item?.style.getPropertyValue('--xeg-aspect-default').trim()).toBe('1200 / 800');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
      '75.0000rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
      '50.0000rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-ratio').trim()).toBe(
      '1.500000'
    );
    expect(item?.dataset.mediaLoaded).toBe('false');
  });

  it('falls back to default token when metadata is missing', () => {
    const { container } = render(
      h(VerticalImageItem, {
        media: baseMedia,
        index: 0,
        isActive: false,
        forceVisible: true,
        onClick: () => {},
        fitMode: 'fitWidth',
      })
    );

    const item = container.querySelector('[data-index="0"]') as HTMLDivElement | null;
    expect(item).not.toBeNull();
    expect(item?.dataset.hasIntrinsicSize).toBe('false');
    expect(item?.style.getPropertyValue('--xeg-aspect-default')).toBe('');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-width')).toBe('');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-height')).toBe('');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-ratio')).toBe('');
    expect(item?.dataset.mediaLoaded).toBe('false');
  });
});
