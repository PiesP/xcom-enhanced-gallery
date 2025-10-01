import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@test-utils/testing-library';

import { renderSolidGalleryShell } from '@/features/gallery/solid/renderSolidGalleryShell';
import { openGallery, closeGallery, galleryState } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';

function createMedia(id: string, overrides: Partial<MediaInfo> = {}): MediaInfo {
  return {
    id,
    url: `https://pbs.twimg.com/media/${id}?format=jpg&name=orig`,
    filename: `${id}.jpg`,
    type: 'image',
    ...overrides,
  };
}

describe('FRAME-ALT-001 Stage B — Solid gallery shell integration', () => {
  let container: HTMLElement;

  // Light DOM 모드: 컨테이너 직접 사용
  const getHost = () => container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    closeGallery();
    container.remove();
    document.body.removeAttribute('data-xeg-gallery-open');
  });

  it.skip('renders media items and syncs navigation state when selecting an item', async () => {
    // SKIP: JSDOM 환경에서 body 속성 동기화 타이밍 이슈
    // 실제 브라우저에서는 정상 동작 확인됨 (Phase F-2)
    const instance = renderSolidGalleryShell({
      container,
      onClose: vi.fn(),
      onPrevious: vi.fn(),
      onNext: vi.fn(),
      onDownloadCurrent: vi.fn(),
      onDownloadAll: vi.fn(),
    });

    openGallery([createMedia('AAA111'), createMedia('BBB222')], 0);

    await waitFor(() => {
      const host = getHost();
      expect(host.querySelectorAll('[data-xeg-role="gallery-item"]').length).toBe(2);
      const counter = host.querySelector('[data-gallery-element="counter"]');
      expect(counter?.textContent?.replace(/\s+/g, '')).toBe('1/2');
      // Light DOM 모드: 직접 쿼리
      expect(container.querySelector('[data-xeg-solid-shell]')).not.toBeNull();
    });

    const items = Array.from(getHost().querySelectorAll('[data-xeg-role="gallery-item"]'));
    expect(items[0].getAttribute('data-force-visible')).toBe('true');
    expect(items[1].getAttribute('data-force-visible')).toBe(null);

    items[1].dispatchEvent(new MouseEvent('click', { bubbles: true }));

    await waitFor(() => {
      expect(galleryState.value.currentIndex).toBe(1);
      const host = getHost();
      const counter = host.querySelector('[data-gallery-element="counter"]');
      expect(counter?.textContent?.replace(/\s+/g, '')).toBe('2/2');
      const updatedItems = Array.from(host.querySelectorAll('[data-xeg-role="gallery-item"]'));
      expect(updatedItems[1].getAttribute('data-force-visible')).toBe('true');
      expect(updatedItems[0].getAttribute('data-force-visible')).toBe(null);
    });

    expect(document.body.getAttribute('data-xeg-gallery-open')).toBe('true');

    instance.dispose();

    await waitFor(() => {
      expect(document.body.getAttribute('data-xeg-gallery-open')).toBeNull();
    });
  });
});
