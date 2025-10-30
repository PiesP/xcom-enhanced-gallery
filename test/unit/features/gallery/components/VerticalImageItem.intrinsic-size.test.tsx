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

  it('uses metadata dimensions when direct width/height are missing', () => {
    const mediaWithMetadata: MediaInfo = {
      ...baseMedia,
      type: 'video',
      width: undefined,
      height: undefined,
      metadata: {
        dimensions: {
          width: 960,
          height: 540,
        },
      },
    };

    const { container } = render(
      h(VerticalImageItem, {
        media: mediaWithMetadata,
        index: 1,
        isActive: false,
        forceVisible: true,
        onClick: () => {},
        fitMode: 'fitWidth',
      })
    );

    const item = container.querySelector('[data-index="1"]') as HTMLDivElement | null;
    expect(item).not.toBeNull();
    expect(item?.dataset.hasIntrinsicSize).toBe('true');
    expect(item?.style.getPropertyValue('--xeg-aspect-default').trim()).toBe('960 / 540');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
      '60.0000rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
      '33.7500rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-ratio').trim()).toBe(
      '1.777778'
    );
  });

  it('derives dimensions from apiData download URL when metadata is absent', () => {
    const mediaWithApiData: MediaInfo = {
      ...baseMedia,
      type: 'video',
      width: undefined,
      height: undefined,
      metadata: {
        apiData: {
          download_url:
            'https://video.twimg.com/ext_tw_video/12345/pu/vid/1280x720/abcd1234.mp4?tag=12',
          aspect_ratio: [16, 9],
        },
      },
    } as MediaInfo;

    const { container } = render(
      h(VerticalImageItem, {
        media: mediaWithApiData,
        index: 2,
        isActive: false,
        forceVisible: true,
        onClick: () => {},
        fitMode: 'fitWidth',
      })
    );

    const item = container.querySelector('[data-index="2"]') as HTMLDivElement | null;
    expect(item).not.toBeNull();
    expect(item?.dataset.hasIntrinsicSize).toBe('true');
    expect(item?.style.getPropertyValue('--xeg-aspect-default').trim()).toBe('1280 / 720');
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
      '80.0000rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
      '45.0000rem'
    );
    expect(item?.style.getPropertyValue('--xeg-gallery-item-intrinsic-ratio').trim()).toBe(
      '1.777778'
    );
  });
});
