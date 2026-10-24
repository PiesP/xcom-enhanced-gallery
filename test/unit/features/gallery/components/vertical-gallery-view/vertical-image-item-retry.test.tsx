// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { VerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem';
import type { MediaInfo } from '@shared/types/media.types';
import { render } from 'solid-js/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('@shared/hooks/use-translation', () => ({
  useTranslation: () => (key: string) => key,
}));
vi.mock(
  '@features/gallery/components/vertical-gallery-view/hooks/use-video-volume-persistence',
  () => ({
    useVideoVolumePersistence: () => ({
      applyMutedProgrammatically: vi.fn(),
      applyVolumeProgrammatically: vi.fn(),
      handleVolumeChange: vi.fn(),
    }),
  })
);

const source = 'https://pbs.twimg.com/media/second.jpg?name=orig';

function media(tweetUrl = 'https://x.com/owner/status/123'): MediaInfo {
  return {
    id: 'second',
    type: 'image',
    url: source,
    downloadSource: { url: source, quality: 'cdn-original', provenance: 'api' },
    tweetUrl,
    width: 560,
    height: 360,
  };
}

describe('VerticalImageItem image recovery', () => {
  let host: HTMLDivElement;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
  });

  afterEach(() => {
    dispose?.();
    host.remove();
    vi.restoreAllMocks();
  });

  function mount(item = media()) {
    const onMediaLoad = vi.fn();
    dispose = render(
      () => (
        <VerticalImageItem
          media={item}
          index={1}
          isActive
          isFocused
          fitMode="fitContainer"
          onClick={vi.fn()}
          onMediaLoad={onMediaLoad}
          scrollRoot={() => host}
          scrollRootHeight={() => 800}
        />
      ),
      host
    );
    const image = host.querySelector('img');
    expect(image).not.toBeNull();
    return { item, image: image!, onMediaLoad };
  }

  it('retries only the failed image with the same display URL and preserves fit and focus', () => {
    const { item, image, onMediaLoad } = mount();
    image.dispatchEvent(new Event('error'));
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('msg.gal.loadFail');
    const retry = host.querySelector<HTMLButtonElement>('[role="alert"] button');
    expect(retry?.textContent).toBe('msg.gal.retryLoading');
    const post = host.querySelector<HTMLAnchorElement>('[role="alert"] a');
    expect(post?.href).toBe('https://x.com/owner/status/123');
    expect(post?.target).toBe('_blank');
    retry?.click();
    const replacement = host.querySelector('img');
    expect(replacement).not.toBe(image);
    expect(replacement?.src).toBe(source);
    expect(host.querySelector('[data-gallery-element="item"]')?.getAttribute('data-fit-mode')).toBe(
      'fitContainer'
    );
    expect(document.activeElement).toBe(host.querySelector('button[aria-label]'));
    expect(item.downloadSource?.url).toBe(source);
    image.dispatchEvent(new Event('error'));
    expect(host.querySelector('[role="alert"]')).toBeNull();
    replacement?.dispatchEvent(new Event('load'));
    expect(
      host.querySelector('[data-gallery-element="item"]')?.getAttribute('data-media-loaded')
    ).toBe('true');
    expect(onMediaLoad).toHaveBeenCalledExactlyOnceWith('second', 1);
  });

  it('bounds persistent failures to two user retries and keeps the original-post route', () => {
    const { image } = mount(media('https://twitter.com/owner/status/123/photo/1?s=20#media'));
    let current = image;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      current.dispatchEvent(new Event('error'));
      host.querySelector<HTMLButtonElement>('[role="alert"] button')?.click();
      const replacement = host.querySelector('img');
      expect(replacement).not.toBe(current);
      current = replacement!;
    }
    current.dispatchEvent(new Event('error'));
    expect(host.querySelector('[role="alert"] button')).toBeNull();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain('msg.gal.retryExhausted');
    expect(host.querySelector('[role="alert"] a')?.textContent).toBe('msg.gal.openOriginalPost');
    expect(host.querySelector<HTMLAnchorElement>('[role="alert"] a')?.href).toBe(
      'https://x.com/owner/status/123'
    );
  });

  it.each([
    'javascript:alert(1)',
    'https://x.com.evil.test/owner/status/123/photo/1?s=20#media',
    'https://name:pass@x.com/owner/status/123/photo/1?s=20#media',
  ])('does not render an unsafe original-post link for %s or update a disposed gallery', (url) => {
    const { image } = mount(media(url));
    image.dispatchEvent(new Event('error'));
    expect(host.querySelector('[role="alert"] a')).toBeNull();
    dispose?.();
    dispose = undefined;
    image.dispatchEvent(new Event('load'));
    expect(host.querySelector('[data-gallery-element="item"]')).toBeNull();
  });
});
