// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { GallerySourceDetails } from '@features/gallery/components/GallerySourceDetails';
import {
  applyObservedDownloadSources,
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
const deferred: MediaInfo = {
  ...unavailable,
  id: 'deferred',
  originalUrl: 'https://pbs.twimg.com/media/deferred?format=webp&name=orig',
  metadata: {
    originalSourceResolution: {
      requestedUrl: 'https://pbs.twimg.com/media/deferred?format=webp&name=orig',
      selectedUrl: null,
      attempts: [],
      reason: 'probe-limit',
    },
  },
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

  it('keeps detail wheel input from moving gallery media or chaining at its boundary', () => {
    openGallery([observed]);
    const details = host.querySelector('details');
    expect(details).not.toBeNull();
    if (!details) {
      throw new Error('Expected source details');
    }
    details.open = true;
    Object.defineProperties(details, {
      scrollHeight: { configurable: true, value: 300 },
      clientHeight: { configurable: true, value: 100 },
    });
    let redirected = 0;
    const redirect = () => {
      redirected++;
    };
    host.addEventListener('wheel', redirect);
    try {
      details.scrollTop = 0;
      const inner = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
      details.querySelector('p')!.dispatchEvent(inner);
      expect(inner.defaultPrevented).toBe(false);
      expect(redirected).toBe(0);
      const boundary = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100 });
      details.dispatchEvent(boundary);
      expect(boundary.defaultPrevented).toBe(true);
      expect(redirected).toBe(0);
    } finally {
      host.removeEventListener('wheel', redirect);
    }
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

  it('marks observed articles as unknown-total and distinguishes deferred from unavailable originals', () => {
    openGallery([deferred], 0, 'visible-article');
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.shown:1');
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.pending');
    expect(host.textContent).toContain('msg.gal.sourceDetails.pendingDetail');
    const revision = gallerySignals.sessionRevision;
    const checked = {
      ...deferred,
      metadata: {
        originalSourceResolution: {
          requestedUrl: deferred.originalUrl,
          selectedUrl: null,
          attempts: [{ url: deferred.originalUrl, status: 403, mime: null }],
          reason: 'probe-failed',
        },
      },
    };
    applyObservedDownloadSources([deferred], [checked], revision);
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.retryable');
    expect(host.textContent).toContain('msg.gal.sourceDetails.retryableDetail');
    const missing = {
      ...checked,
      metadata: {
        originalSourceResolution: {
          ...checked.metadata.originalSourceResolution,
          reason: 'not-found',
        },
      },
    };
    applyObservedDownloadSources([checked], [missing], revision);
    expect(host.querySelector('summary')?.textContent).toContain(
      'msg.gal.sourceDetails.unavailable'
    );
    closeGallery();
    openGallery([deferred], 0, 'visible-article');
    applyObservedDownloadSources([deferred], [checked], revision);
    expect(host.querySelector('summary')?.textContent).toContain('msg.gal.sourceDetails.pending');
  });

  it('identifies a known unsupported API subset without inventing a raw post count', () => {
    openGallery([verified], 0, 'api-supported-subset');
    expect(host.querySelector('summary')?.textContent).toContain(
      'msg.gal.sourceDetails.knownSubset:1'
    );
    expect(host.textContent).toContain('msg.gal.knownSubset.body');
  });
});
