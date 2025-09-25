import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import type { MediaInfo } from '@shared/types/media.types';

const openGalleryMock = vi.fn<[MediaInfo[], number?], void>();
const closeGalleryMock = vi.fn();
const setErrorMock = vi.fn();
const setLoadingMock = vi.fn();
const setViewModeMock = vi.fn();
const navigatePreviousMock = vi.fn();
const navigateNextMock = vi.fn();

const galleryState = {
  value: {
    isOpen: false,
    mediaItems: [] as MediaInfo[],
    currentIndex: 0,
  },
};

vi.mock('@shared/state/signals/gallery.signals', () => ({
  galleryState,
  openGallery: openGalleryMock,
  closeGallery: closeGalleryMock,
  setError: setErrorMock,
  setLoading: setLoadingMock,
  setViewMode: setViewModeMock,
  navigatePrevious: navigatePreviousMock,
  navigateNext: navigateNextMock,
}));

function createDocumentStub() {
  const body = {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    contains: vi.fn(() => false),
  };

  return {
    querySelector: vi.fn(() => null),
    createElement: vi.fn(() => ({
      id: '',
      style: { cssText: '' },
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
    })),
    body,
  } as unknown;
}

describe('GalleryApp.prepareForGallery integration', () => {
  let originalDocument: unknown;

  beforeEach(() => {
    CoreService.resetInstance();

    galleryState.value = { isOpen: false, mediaItems: [], currentIndex: 0 };
    openGalleryMock.mockImplementation((items: MediaInfo[], index = 0) => {
      galleryState.value = {
        isOpen: true,
        mediaItems: items,
        currentIndex: index,
      };
    });

    openGalleryMock.mockClear();
    closeGalleryMock.mockClear();
    setErrorMock.mockClear();
    setLoadingMock.mockClear();
    setViewModeMock.mockClear();
    navigatePreviousMock.mockClear();
    navigateNextMock.mockClear();

    originalDocument = globalThis.document;
    vi.stubGlobal('document', createDocumentStub());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalDocument) {
      globalThis.document = originalDocument as typeof globalThis.document;
    }
    CoreService.resetInstance();
  });

  it('calls MediaService.prepareForGallery before opening gallery state', async () => {
    const serviceManager = CoreService.getInstance();
    const prepareForGallery = vi.fn().mockResolvedValue(undefined);

    serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, {
      prepareForGallery,
    });

    const { GalleryApp } = await import('@features/gallery/GalleryApp');
    const app = new GalleryApp();

    const mediaItems: MediaInfo[] = [
      {
        id: 'media-1',
        url: 'https://example.com/media-1.jpg',
        type: 'image',
        filename: 'media-1.jpg',
      },
    ];

    await app.openGallery(mediaItems, 0);

    expect(prepareForGallery).toHaveBeenCalledTimes(1);
    expect(openGalleryMock).toHaveBeenCalledTimes(1);

    const prepareOrder = prepareForGallery.mock.invocationCallOrder[0];
    const openOrder = openGalleryMock.mock.invocationCallOrder[0];
    expect(prepareOrder).toBeLessThan(openOrder);
  });
});
