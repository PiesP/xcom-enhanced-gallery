// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { GallerySourceDetails } from '@features/gallery/components/GallerySourceDetails';
import {
  closeGallery,
  gallerySignals,
  navigateToItem,
  openGallery,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${params.count}` : key,
}));

const verified: MediaInfo = {
  id: 'verified',
  type: 'image',
  url: 'https://pbs.twimg.com/media/verified.jpg',
  downloadSource: {
    provenance: 'dom',
    quality: 'cdn-original',
    url: 'https://pbs.twimg.com/media/verified.jpg?name=orig',
  },
};
const observed: MediaInfo = {
  id: 'observed',
  type: 'video',
  url: 'https://video.twimg.com/ext_tw_video/1/pu/vid/observed.mp4',
  downloadSource: {
    provenance: 'dom',
    quality: 'observed',
    url: 'https://video.twimg.com/ext_tw_video/1/pu/vid/preferred.mp4',
  },
};
const unavailable: MediaInfo = {
  ...verified,
  id: 'unavailable',
  downloadSource: { provenance: 'dom', quality: 'unverified-original', url: '' },
};

describe('current media source limitations', () => {
  let host: HTMLDivElement;
  let dispose: () => void;
  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    dispose = render(() => <GallerySourceDetails />, host);
  });
  afterEach(() => {
    dispose();
    host.remove();
    closeGallery();
  });

  it('avoids warnings for verified DOM/API sources and follows displayed-item quality', () => {
    openGallery([verified, observed, unavailable]);
    expect(host.querySelector('details')).toBeNull();
    navigateToItem(1, 'keyboard');
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.observed');
    host.querySelector('summary')?.click();
    expect(host.textContent).toContain('msg.gal.sourceDetails.observedDetail');
    expect(observed.downloadSource?.url).toContain('preferred.mp4');
    navigateToItem(2, 'keyboard');
    expect(host.querySelector('summary')?.textContent).toContain(
      'msg.gal.sourceDetails.unavailable'
    );
    expect(host.querySelector('details')?.open).toBe(false);
    expect(host.textContent).not.toContain('msg.gal.sourceDetails.observedDetail');
    navigateToItem(0, 'keyboard');
    expect(host.querySelector('details')).toBeNull();
  });

  it('retains only validated visible-tile scope for this session and never invents a post total', () => {
    openGallery([verified, observed], 0, 'visible-tile');
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.shown:2');
    expect(host.textContent).toContain('msg.gal.sourceDetails.cdnOriginal');
    closeGallery();
    expect(gallerySignals.recoveryScope).toBeNull();
    openGallery([verified]);
    expect(host.querySelector('details')).toBeNull();
  });
});
