import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/constants', async () => {
  const actual = await vi.importActual<typeof import('@/constants')>('@/constants');
  return {
    ...actual,
    FEATURE_FLAGS: {
      ...actual.FEATURE_FLAGS,
      vdomRebind: false,
    },
  };
});

const renderMock = vi.fn();
const createElementMock = vi.fn((type: unknown, props: unknown, ...children: unknown[]) => ({
  type,
  props,
  children,
}));
const hMock = vi.fn((type: unknown, props: unknown, ...children: unknown[]) => ({
  type,
  props,
  children,
}));

vi.mock('@shared/external/vendors', () => ({
  getPreact: () => ({
    render: renderMock,
    createElement: createElementMock,
    h: hMock,
  }),
  getPreactHooks: () => ({
    useCallback: (fn: unknown) => fn,
    useEffect: () => undefined,
    useRef: () => ({ current: null }),
  }),
  getPreactCompat: () => ({
    memo: <T>(component: T) => component,
  }),
  getPreactSignals: () => ({
    signal: <T>(value: T) => ({
      value,
      peek: () => value,
      subscribe: () => () => undefined,
    }),
  }),
  initializeVendors: () => undefined,
}));

type GalleryState = {
  value: {
    isOpen: boolean;
    mediaItems: unknown[];
    currentIndex: number;
  };
  subscribe: (listener: (state: GalleryState['value']) => void) => () => void;
};

const openGalleryMock = vi.fn<[unknown[], number?], void>();
const closeGalleryMock = vi.fn();
const setErrorMock = vi.fn();
const setLoadingMock = vi.fn();
const setViewModeMock = vi.fn();
const navigatePreviousMock = vi.fn();
const navigateNextMock = vi.fn();

const subscribers = new Set<(state: GalleryState['value']) => void>();

const galleryState: GalleryState = {
  value: {
    isOpen: false,
    mediaItems: [],
    currentIndex: 0,
  },
  subscribe(listener) {
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
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

import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import type { MediaInfo } from '@shared/types/media.types';

function createDocumentStub() {
  const nodes = new Set<object>();
  const body = {
    appendChild: vi.fn((node: object) => {
      nodes.add(node);
      return node;
    }),
    removeChild: vi.fn((node: object) => {
      nodes.delete(node);
      return node;
    }),
    contains: vi.fn((node: object) => nodes.has(node)),
  };

  return {
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({
      className: '',
      setAttribute: vi.fn(),
      appendChild: vi.fn(),
      remove: vi.fn(),
      style: { cssText: '' },
      hasAttribute: vi.fn(() => false),
      closest: vi.fn(() => null),
    })),
    body,
    contains: vi.fn((node: object) => body.contains(node)),
  } as unknown;
}

describe('GalleryRenderer.prepareForGallery integration', () => {
  let originalDocument: unknown;

  beforeEach(() => {
    CoreService.resetInstance();

    subscribers.clear();
    galleryState.value = { isOpen: false, mediaItems: [], currentIndex: 0 };

    openGalleryMock.mockImplementation((items: unknown[], index = 0) => {
      galleryState.value = {
        isOpen: true,
        mediaItems: items,
        currentIndex: index,
      };
      subscribers.forEach(listener => listener({ ...galleryState.value }));
    });

    openGalleryMock.mockClear();
    closeGalleryMock.mockClear();
    setErrorMock.mockClear();
    setLoadingMock.mockClear();
    setViewModeMock.mockClear();
    navigatePreviousMock.mockClear();
    navigateNextMock.mockClear();
    renderMock.mockClear();
    createElementMock.mockClear();
    hMock.mockClear();

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

  it('awaits MediaService.prepareForGallery before opening gallery state', async () => {
    const serviceManager = CoreService.getInstance();
    const prepareForGallery = vi.fn().mockResolvedValue(undefined);

    serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, {
      prepareForGallery,
    });

    const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
    const renderer = new GalleryRenderer();

    const mediaItems: MediaInfo[] = [
      {
        id: 'media-1',
        url: 'https://example.com/media-1.jpg',
        type: 'image',
        filename: 'media-1.jpg',
      },
    ];

    await renderer.render(mediaItems, { startIndex: 0 });

    expect(prepareForGallery).toHaveBeenCalledTimes(1);
    expect(openGalleryMock).toHaveBeenCalledTimes(1);

    const prepareOrder = prepareForGallery.mock.invocationCallOrder[0];
    const openOrder = openGalleryMock.mock.invocationCallOrder[0];
    expect(prepareOrder).toBeLessThan(openOrder);
  });
});
