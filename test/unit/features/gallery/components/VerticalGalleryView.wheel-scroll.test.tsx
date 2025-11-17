/**
 * @fileoverview VerticalGalleryView 휠 스크롤 통합 테스트
 */

import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, h } from '@test/utils/testing-library';
import type { MediaInfo } from '@shared/types';
import { galleryState } from '@shared/state/signals/gallery.signals';

type CapturedScrollOptions = {
  container?: () => HTMLElement | null;
  scrollTarget?: () => HTMLElement | null;
  enabled?: () => boolean;
  onScroll?: (delta: number, target: HTMLElement | null) => void;
};

let latestScrollOptions: CapturedScrollOptions | undefined;

const useGalleryScrollMock = vi.fn((options?: CapturedScrollOptions & Record<string, unknown>) => {
  latestScrollOptions = options;
  return {
    lastScrollTime: () => Date.now(),
    isScrolling: () => false,
    scrollDirection: () => 'idle' as const,
    state: () => ({
      isScrolling: false,
      lastScrollTime: 0,
      lastDelta: 0,
      direction: 'idle' as const,
    }),
  };
});

vi.mock('@/features/gallery/hooks/useGalleryScroll', () => ({
  useGalleryScroll: (options: unknown) =>
    useGalleryScrollMock(
      options as { onScroll?: (delta: number, target: HTMLElement | null) => void }
    ),
  SCROLL_IDLE_TIMEOUT: 150,
}));

vi.mock('@/features/gallery/components/vertical-gallery-view/hooks/useGalleryItemScroll', () => ({
  useGalleryItemScroll: vi.fn(),
}));

vi.mock('@/features/gallery/components/vertical-gallery-view/hooks/useGalleryCleanup', () => ({
  useGalleryCleanup: vi.fn(),
}));

vi.mock('@/features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard', () => ({
  useGalleryKeyboard: vi.fn(),
}));

vi.mock('@/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings', () => ({
  ToolbarWithSettings: () => null,
}));

vi.mock('@/features/gallery/components/vertical-gallery-view/VerticalImageItem', () => ({
  VerticalImageItem: () => null,
}));

vi.mock(
  '@/features/gallery/components/vertical-gallery-view/KeyboardHelpOverlay/KeyboardHelpOverlay',
  () => ({
    KeyboardHelpOverlay: () => null,
  })
);

vi.mock('@/shared/utils/animations', () => ({
  animateGalleryEnter: vi.fn(),
  animateGalleryExit: vi.fn(),
  setupScrollAnimation: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@/shared/utils/viewport', () => ({
  observeViewportCssVars: vi.fn().mockReturnValue(() => {}),
}));

vi.mock('@shared/container/settings-access', () => ({
  getSetting: (_key: string, fallback: unknown) => fallback,
  setSetting: vi.fn(() => Promise.resolve()),
  tryGetSettingsService: () => null,
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
    latestScrollOptions = undefined;
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

  it('useGalleryScroll 훅에 갤러리 컨테이너와 아이템 컨테이너를 전달한다', async () => {
    const { VerticalGalleryView } = await import(
      '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
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

    expect(latestScrollOptions).toBeDefined();
    if (!latestScrollOptions) return;

    expect(latestScrollOptions.container?.()).toBe(gallery);
    expect(latestScrollOptions.scrollTarget?.()).toBe(itemsContainer);
    expect(latestScrollOptions.onScroll).toBeUndefined();
  });

  it('enabled accessor는 갤러리 아이템 존재 여부에 따라 변한다', async () => {
    const { VerticalGalleryView } = await import(
      '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
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

    expect(latestScrollOptions).toBeDefined();
    if (!latestScrollOptions) return;

    expect(latestScrollOptions.enabled?.()).toBe(true);

    galleryState.value = {
      ...galleryState.value,
      mediaItems: [],
    };

    await Promise.resolve();

    expect(latestScrollOptions.enabled?.()).toBe(false);
  });
});
