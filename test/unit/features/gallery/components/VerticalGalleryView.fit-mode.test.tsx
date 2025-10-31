/**
 * @fileoverview VerticalGalleryView 이미지 핏 모드 회귀 테스트
 */

import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, h, waitFor, act } from '@test/utils/testing-library';
import type { MediaInfo } from '@/shared/types';
import { galleryState } from '@/shared/state/signals/gallery.signals';
import { downloadState } from '@/shared/state/signals/download.signals';

let capturedFitHandlers:
  | {
      onFitOriginal?: (event?: globalThis.Event) => void;
      onFitWidth?: (event?: globalThis.Event) => void;
      onFitHeight?: (event?: globalThis.Event) => void;
      onFitContainer?: (event?: globalThis.Event) => void;
    }
  | undefined;

const getSettingMock = vi.fn(() => 'fitWidth');
const setSettingMock = vi.fn(() => Promise.resolve());
const unsubscribeMock = vi.fn();
const subscribeMock = vi.fn(() => unsubscribeMock);
const scrollIntoViewMock = vi.fn();
const scrollToCurrentItemMock = vi.fn();
const useGalleryItemScrollMock = vi.fn(() => ({
  scrollToItem: vi.fn(),
  scrollToCurrentItem: scrollToCurrentItemMock,
}));

beforeAll(() => {
  Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: scrollIntoViewMock,
  });
});

vi.mock('@/shared/components/ui/Toolbar/Toolbar', () => ({
  Toolbar: (props: Record<string, unknown>) => {
    capturedFitHandlers = {
      onFitOriginal: props.onFitOriginal as (event?: globalThis.Event) => void,
      onFitWidth: props.onFitWidth as (event?: globalThis.Event) => void,
      onFitHeight: props.onFitHeight as (event?: globalThis.Event) => void,
      onFitContainer: props.onFitContainer as (event?: globalThis.Event) => void,
    };
    return null;
  },
}));

vi.mock('@/features/gallery/hooks/useGalleryItemScroll', () => ({
  useGalleryItemScroll: useGalleryItemScrollMock,
}));

vi.mock('@/shared/container/settings-access', () => ({
  getSetting: getSettingMock,
  setSetting: setSettingMock,
  tryGetSettingsService: () => ({
    subscribe: subscribeMock,
  }),
}));

const mediaItems: MediaInfo[] = [
  {
    id: 'media-1',
    url: 'https://example.com/1.jpg',
    type: 'image',
    filename: '1.jpg',
    width: 1024,
    height: 768,
  },
];

const resetGalleryState = () => {
  galleryState.value = {
    isOpen: true,
    mediaItems,
    currentIndex: 0,
    isLoading: false,
    error: null,
    viewMode: 'vertical',
  };
};

const resetDownloadState = () => {
  downloadState.value = {
    activeTasks: new Map(),
    queue: [],
    isProcessing: false,
    globalProgress: 0,
  };
};

describe('VerticalGalleryView – 이미지 핏 모드 동기화', () => {
  beforeEach(() => {
    capturedFitHandlers = undefined;
    getSettingMock.mockClear();
    setSettingMock.mockClear();
    subscribeMock.mockClear();
    unsubscribeMock.mockClear();
    scrollToCurrentItemMock.mockClear();
    useGalleryItemScrollMock.mockClear();
    resetGalleryState();
    resetDownloadState();
  });

  afterEach(() => {
    cleanup();
    resetGalleryState();
    galleryState.value = {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      viewMode: 'vertical',
    };
    resetDownloadState();
    scrollIntoViewMock.mockClear();
  });

  it('툴바 버튼을 호출하면 현재 아이템 컨테이너의 fit 클래스와 data-fit-mode가 동기화되어야 함', async () => {
    const { VerticalGalleryView } = await import(
      '@/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const { container } = render(h(VerticalGalleryView));

    await waitFor(() => {
      const initialItem = container.querySelector('[data-index="0"]') as HTMLDivElement | null;
      expect(initialItem).not.toBeNull();
      if (!initialItem) {
        throw new Error('expected gallery item');
      }

      expect(initialItem.getAttribute('data-fit-mode')).toBe('fitWidth');
      const classList = Array.from(initialItem.classList);
      expect(classList.some(className => className.includes('fitWidth'))).toBe(true);
      expect(initialItem.getAttribute('data-has-intrinsic-size')).toBe('true');
      expect(
        initialItem.getAttribute('style')?.includes('--xeg-gallery-item-intrinsic-width')
      ).toBe(true);
      expect(initialItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
        '64.0000rem'
      );
      expect(initialItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
        '48.0000rem'
      );
      expect(initialItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-ratio').trim()).toBe(
        '1.333333'
      );
      expect(initialItem.getAttribute('data-media-loaded')).toBe('false');
    });

    expect(capturedFitHandlers?.onFitOriginal).toBeTypeOf('function');
    act(() => {
      capturedFitHandlers?.onFitOriginal?.();
    });

    expect(scrollToCurrentItemMock).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'original');
    });

    await waitFor(() => {
      const updatedItem = container.querySelector('[data-index="0"]') as HTMLDivElement | null;
      expect(updatedItem).not.toBeNull();
      if (!updatedItem) {
        throw new Error('expected gallery item after fit change');
      }

      expect(updatedItem.getAttribute('data-fit-mode')).toBe('original');
      const classList = Array.from(updatedItem.classList);
      expect(classList.some(className => className.includes('fitOriginal'))).toBe(true);
      expect(classList.some(className => className.includes('fitWidth'))).toBe(false);
      expect(updatedItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
        '64.0000rem'
      );
      expect(updatedItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
        '48.0000rem'
      );
      expect(updatedItem.getAttribute('data-media-loaded')).toBe('false');
    });

    expect(capturedFitHandlers?.onFitContainer).toBeTypeOf('function');
    act(() => {
      capturedFitHandlers?.onFitContainer?.();
    });

    expect(scrollToCurrentItemMock).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'fitContainer');
    });

    await waitFor(() => {
      const finalItem = container.querySelector('[data-index="0"]') as HTMLDivElement | null;
      expect(finalItem).not.toBeNull();
      if (!finalItem) {
        throw new Error('expected gallery item after fitContainer');
      }

      expect(finalItem.getAttribute('data-fit-mode')).toBe('fitContainer');
      const classList = Array.from(finalItem.classList);
      expect(classList.some(className => className.includes('fitContainer'))).toBe(true);
      expect(classList.some(className => className.includes('fitOriginal'))).toBe(false);
      expect(finalItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-width').trim()).toBe(
        '64.0000rem'
      );
      expect(finalItem.style.getPropertyValue('--xeg-gallery-item-intrinsic-height').trim()).toBe(
        '48.0000rem'
      );
      expect(finalItem.getAttribute('data-media-loaded')).toBe('false');
    });

    expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'original');
    expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'fitContainer');
  });
});
