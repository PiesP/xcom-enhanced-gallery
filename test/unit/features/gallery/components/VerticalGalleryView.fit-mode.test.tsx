/**
 * @fileoverview VerticalGalleryView 이미지 핏 모드 회귀 테스트
 */

import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, h, waitFor, act } from '@test/utils/testing-library';
import type { MediaInfo } from '../../../../../src/shared/types';
import { galleryState } from '../../../../../src/shared/state/signals/gallery.signals';
import { downloadState } from '../../../../../src/shared/state/signals/download.signals';

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
const scrollIntoViewMock = vi.fn();

beforeAll(() => {
  Object.defineProperty(globalThis.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: scrollIntoViewMock,
  });
});

vi.mock('../../../../../src/shared/components/ui/ToolbarWithSettings/ToolbarWithSettings', () => ({
  ToolbarWithSettings: (props: Record<string, unknown>) => {
    capturedFitHandlers = {
      onFitOriginal: props.onFitOriginal as (event?: globalThis.Event) => void,
      onFitWidth: props.onFitWidth as (event?: globalThis.Event) => void,
      onFitHeight: props.onFitHeight as (event?: globalThis.Event) => void,
      onFitContainer: props.onFitContainer as (event?: globalThis.Event) => void,
    };
    return null;
  },
}));

vi.mock('../../../../../src/shared/container/settings-access', () => ({
  getSetting: getSettingMock,
  setSetting: setSettingMock,
}));

const mediaItems: MediaInfo[] = [
  {
    id: 'media-1',
    url: 'https://example.com/1.jpg',
    type: 'image',
    filename: '1.jpg',
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
      '../../../../../src/features/gallery/components/vertical-gallery-view/VerticalGalleryView'
    );

    const { container } = render(h(VerticalGalleryView));

    await waitFor(() => {
      const initialItem = container.querySelector('[data-index="0"]');
      expect(initialItem).not.toBeNull();
      expect(initialItem?.getAttribute('data-fit-mode')).toBe('fitWidth');
      expect(
        initialItem &&
          Array.from(initialItem.classList).some(className => className.includes('fitWidth'))
      ).toBe(true);
    });

    expect(capturedFitHandlers?.onFitOriginal).toBeTypeOf('function');
    act(() => {
      capturedFitHandlers?.onFitOriginal?.();
    });

    await waitFor(() => {
      expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'original');
    });

    await waitFor(() => {
      const updatedItem = container.querySelector('[data-index="0"]');
      expect(updatedItem).not.toBeNull();
      expect(updatedItem?.getAttribute('data-fit-mode')).toBe('original');
      expect(
        updatedItem &&
          Array.from(updatedItem.classList).some(className => className.includes('fitOriginal'))
      ).toBe(true);
      expect(
        updatedItem &&
          Array.from(updatedItem.classList).some(className => className.includes('fitWidth'))
      ).toBe(false);
    });

    expect(capturedFitHandlers?.onFitContainer).toBeTypeOf('function');
    act(() => {
      capturedFitHandlers?.onFitContainer?.();
    });

    await waitFor(() => {
      expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'fitContainer');
    });

    await waitFor(() => {
      const finalItem = container.querySelector('[data-index="0"]');
      expect(finalItem).not.toBeNull();
      expect(finalItem?.getAttribute('data-fit-mode')).toBe('fitContainer');
      expect(
        finalItem &&
          Array.from(finalItem.classList).some(className => className.includes('fitContainer'))
      ).toBe(true);
      expect(
        finalItem &&
          Array.from(finalItem.classList).some(className => className.includes('fitOriginal'))
      ).toBe(false);
    });

    expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'original');
    expect(setSettingMock).toHaveBeenCalledWith('gallery.imageFitMode', 'fitContainer');
  });
});
