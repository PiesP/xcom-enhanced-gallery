/**
 * @fileoverview VerticalGalleryView 휠 스크롤 통합 테스트
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, h } from '@test/utils/testing-library';
import type { MediaInfo } from '../../../../../src/shared/types';
import { galleryState } from '../../../../../src/shared/state/signals/gallery.signals';

let capturedOnScroll: ((delta: number, target: HTMLElement | null) => void) | undefined;

const useGalleryScrollMock = vi.fn(
  (options?: { onScroll?: (delta: number, target: HTMLElement | null) => void }) => {
    capturedOnScroll = options?.onScroll;
    return {
      lastScrollTime: () => Date.now(),
      isScrolling: () => false,
      scrollDirection: () => 'idle' as const,
    };
  }
);

vi.mock('../../../../../src/features/gallery/hooks/useGalleryScroll', () => ({
  useGalleryScroll: (options: unknown) =>
    useGalleryScrollMock(
      options as { onScroll?: (delta: number, target: HTMLElement | null) => void }
    ),
}));

vi.mock(
  '../../../../../src/features/gallery/components/vertical-gallery-view/hooks/useGalleryItemScroll',
  () => ({
    useGalleryItemScroll: vi.fn(),
  })
);

vi.mock(
  '../../../../../src/features/gallery/components/vertical-gallery-view/hooks/useGalleryCleanup',
  () => ({
    useGalleryCleanup: vi.fn(),
  })
);

vi.mock(
  '../../../../../src/features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard',
  () => ({
    useGalleryKeyboard: vi.fn(),
  })
);

vi.mock('../../../../../src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings', () => ({
  ToolbarWithSettings: () => null,
}));

vi.mock(
  '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalImageItem',
  () => ({
    VerticalImageItem: () => null,
  })
);

vi.mock(
  '../../../../../src/features/gallery/components/KeyboardHelpOverlay/KeyboardHelpOverlay',
  () => ({
    KeyboardHelpOverlay: () => null,
  })
);

vi.mock('../../../../../src/shared/utils/animations', () => ({
  animateGalleryEnter: vi.fn(),
  animateGalleryExit: vi.fn(),
  setupScrollAnimation: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('../../../../../src/shared/utils/viewport', () => ({
  observeViewportCssVars: vi.fn().mockReturnValue(() => {}),
}));

describe('VerticalGalleryView – wheel scroll handling (P0)', () => {
  const mediaItems: MediaInfo[] = [
    {
      id: '1',
      url: 'https://example.com/1.jpg',
      type: 'image',
      filename: '1.jpg',
    },
    {
      id: '2',
      url: 'https://example.com/2.jpg',
      type: 'image',
      filename: '2.jpg',
    },
  ];

  beforeEach(() => {
    capturedOnScroll = undefined;
    useGalleryScrollMock.mockClear();

    galleryState.value = {
      isOpen: true,
      mediaItems,
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
  });

  afterEach(() => {
    cleanup();
    useGalleryScrollMock.mockClear();
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
  });

  it('휠 델타가 전달되면 아이템 컨테이너 scrollBy가 호출되어야 함', async () => {
    const { VerticalGalleryView } = await import(
      '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const { container } = render(h(VerticalGalleryView));

    const gallery = container.querySelector(
      '[data-xeg-role="gallery"]'
    ) as globalThis.HTMLDivElement | null;
    const itemsContainer = container.querySelector(
      '[data-xeg-role="items-container"]'
    ) as globalThis.HTMLDivElement | null;
    expect(gallery).not.toBeNull();
    expect(itemsContainer).not.toBeNull();
    if (!gallery || !itemsContainer) return;

    gallery.scrollTop = 400;
    Object.defineProperty(gallery, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(gallery, 'clientHeight', { value: 600, configurable: true });

    itemsContainer.scrollTop = 400;
    Object.defineProperty(itemsContainer, 'scrollHeight', { value: 2400, configurable: true });
    Object.defineProperty(itemsContainer, 'clientHeight', { value: 800, configurable: true });

    const scrollSpy = vi.fn();
    const itemsScrollSpy = vi.fn();
    gallery.scrollBy = scrollSpy;
    itemsContainer.scrollBy = itemsScrollSpy as typeof itemsContainer.scrollBy;

    expect(capturedOnScroll).toBeTypeOf('function');
    capturedOnScroll?.(120, itemsContainer);

    expect(itemsScrollSpy).toHaveBeenCalledTimes(1);
    const callArg = itemsScrollSpy.mock.calls[0]?.[0] as {
      top: number;
      left?: number;
      behavior?: globalThis.ScrollBehavior;
    };
    expect(callArg?.top).toBeGreaterThan(0);
    expect(callArg?.left ?? 0).toBe(0);
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('컨테이너가 최상단일 때 음수 델타는 무시되어야 함', async () => {
    const { VerticalGalleryView } = await import(
      '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const { container } = render(h(VerticalGalleryView));

    const gallery = container.querySelector(
      '[data-xeg-role="gallery"]'
    ) as globalThis.HTMLDivElement | null;
    const itemsContainer = container.querySelector(
      '[data-xeg-role="items-container"]'
    ) as globalThis.HTMLDivElement | null;
    expect(gallery).not.toBeNull();
    expect(itemsContainer).not.toBeNull();
    if (!gallery || !itemsContainer) return;

    gallery.scrollTop = 0;
    Object.defineProperty(gallery, 'scrollHeight', { value: 1200, configurable: true });
    Object.defineProperty(gallery, 'clientHeight', { value: 600, configurable: true });

    itemsContainer.scrollTop = 0;
    Object.defineProperty(itemsContainer, 'scrollHeight', { value: 2200, configurable: true });
    Object.defineProperty(itemsContainer, 'clientHeight', { value: 700, configurable: true });

    const scrollSpy = vi.fn();
    const itemsScrollSpy = vi.fn();
    gallery.scrollBy = scrollSpy;
    itemsContainer.scrollBy = itemsScrollSpy as typeof itemsContainer.scrollBy;

    expect(capturedOnScroll).toBeTypeOf('function');
    capturedOnScroll?.(-240, itemsContainer);

    expect(itemsScrollSpy).not.toHaveBeenCalled();
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
