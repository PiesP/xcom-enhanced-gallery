/**
 * @fileoverview GalleryApp activation tests aligned with Solid migration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreService } from '@shared/services/ServiceManager';
import { SERVICE_KEYS } from '@/constants';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import type { GalleryApp as GalleryAppClass } from '@features/gallery/GalleryApp';
import type { MediaInfo } from '@shared/types/media.types';

interface MediaServiceMock {
  readonly extractFromClickedElement: ReturnType<typeof vi.fn>;
  readonly extractMediaFromTweet: ReturnType<typeof vi.fn>;
  readonly restoreBackgroundVideos: ReturnType<typeof vi.fn>;
}

interface RendererMock {
  readonly instance: GalleryRenderer;
  readonly render: ReturnType<typeof vi.fn>;
  readonly close: ReturnType<typeof vi.fn>;
  readonly destroy: ReturnType<typeof vi.fn>;
  readonly isRendering: ReturnType<typeof vi.fn>;
  readonly setOnCloseCallback: ReturnType<typeof vi.fn>;
}

let serviceManager: CoreService;
let mediaServiceMock: MediaServiceMock;
let rendererMock: RendererMock;
let initializeEventsMock: ReturnType<typeof vi.fn>;
let cleanupEventsMock: ReturnType<typeof vi.fn>;
let galleryStateMock: { value: { isOpen: boolean; mediaItems: MediaInfo[]; currentIndex: number } };
let openGalleryMock: ReturnType<typeof vi.fn>;
let closeGalleryMock: ReturnType<typeof vi.fn>;
let unmountGalleryMock: ReturnType<typeof vi.fn>;

const sampleMediaItem: MediaInfo = {
  id: 'sample-media',
  url: 'https://pbs.twimg.com/media/sample.jpg',
  originalUrl: 'https://pbs.twimg.com/media/sample.jpg?name=orig',
  type: 'image',
  filename: 'sample.jpg',
};

function createMediaServiceMock(): MediaServiceMock {
  const extractFromClickedElement = vi.fn(async () => ({
    success: true,
    mediaItems: [sampleMediaItem],
    clickedIndex: 0,
  }));
  const extractMediaFromTweet = vi.fn(async () => []);
  const restoreBackgroundVideos = vi.fn();
  return { extractFromClickedElement, extractMediaFromTweet, restoreBackgroundVideos };
}

function createRendererMock(): RendererMock {
  const render = vi.fn(async (_items: readonly MediaInfo[], _options?: unknown) => undefined);
  const close = vi.fn(() => undefined);
  const destroy = vi.fn(() => undefined);
  const isRendering = vi.fn(() => false);
  const setOnCloseCallback = vi.fn((_callback: () => void) => {
    return undefined;
  });
  const instance: GalleryRenderer = {
    render: (items, options) => render(items, options),
    close: () => close(),
    destroy: () => destroy(),
    isRendering: () => isRendering(),
    setOnCloseCallback: onClose => setOnCloseCallback(onClose),
  };
  return { instance, render, close, destroy, isRendering, setOnCloseCallback };
}

function setupSignalsMock(): void {
  galleryStateMock = {
    value: {
      isOpen: false,
      mediaItems: [],
      currentIndex: 0,
    },
  };

  openGalleryMock = vi.fn((items: MediaInfo[], index: number) => {
    galleryStateMock.value.isOpen = true;
    galleryStateMock.value.mediaItems = items;
    galleryStateMock.value.currentIndex = index;
  });

  closeGalleryMock = vi.fn(() => {
    galleryStateMock.value.isOpen = false;
  });

  vi.doMock('@shared/state/signals/gallery.signals', () => ({
    galleryState: galleryStateMock,
    openGallery: openGalleryMock,
    closeGallery: closeGalleryMock,
  }));
}

function setupEventsMock(): void {
  initializeEventsMock = vi.fn().mockResolvedValue(undefined);
  cleanupEventsMock = vi.fn();

  vi.doMock('@shared/utils/events', () => ({
    initializeGalleryEvents: initializeEventsMock,
    cleanupGalleryEvents: cleanupEventsMock,
  }));
}

function setupIsolationMock(): void {
  unmountGalleryMock = vi.fn();
  vi.doMock('@shared/components/isolation', () => ({
    unmountGallery: unmountGalleryMock,
  }));
}

async function createGalleryApp(): Promise<GalleryAppClass> {
  const module = await import('@features/gallery/GalleryApp');
  return new module.GalleryApp();
}

function registerCoreServices(): void {
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, {
    extractFromClickedElement: mediaServiceMock.extractFromClickedElement,
    extractMediaFromTweet: mediaServiceMock.extractMediaFromTweet,
    restoreBackgroundVideos: mediaServiceMock.restoreBackgroundVideos,
  });

  serviceManager.register(SERVICE_KEYS.GALLERY_RENDERER, rendererMock.instance);
}

beforeEach(() => {
  vi.resetModules();
  document.body.innerHTML = '';
  CoreService.resetInstance();
  serviceManager = CoreService.getInstance();

  mediaServiceMock = createMediaServiceMock();
  rendererMock = createRendererMock();
  registerCoreServices();
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
  CoreService.resetInstance();
});

describe('GalleryApp activation', () => {
  it('initializes event handlers and wires renderer close callback', async () => {
    setupSignalsMock();
    setupEventsMock();
    setupIsolationMock();

    const app = await createGalleryApp();
    await app.initialize();

    expect(initializeEventsMock).toHaveBeenCalledTimes(1);

    const firstInitializeCall = initializeEventsMock.mock.calls[0];
    if (!firstInitializeCall) {
      throw new Error('initializeGalleryEvents was not invoked');
    }

    type GalleryEventHandlers = {
      onMediaClick: (
        media: MediaInfo,
        element: HTMLElement,
        event: globalThis.Event
      ) => Promise<void>;
      onGalleryClose: () => void;
      onKeyboardEvent: (event: globalThis.KeyboardEvent) => void;
    };

    const handlers = firstInitializeCall[0] as GalleryEventHandlers;

    expect(typeof handlers.onMediaClick).toBe('function');
    expect(typeof handlers.onGalleryClose).toBe('function');
    expect(typeof handlers.onKeyboardEvent).toBe('function');

    expect(rendererMock.setOnCloseCallback).toHaveBeenCalledTimes(1);
    const closeCallbackCall = rendererMock.setOnCloseCallback.mock.calls[0];
    if (!closeCallbackCall) {
      throw new Error('setOnCloseCallback was not invoked');
    }
    const [closeHandler] = closeCallbackCall as Parameters<GalleryRenderer['setOnCloseCallback']>;
    if (!closeHandler) {
      throw new Error('close handler was not provided');
    }

    mediaServiceMock.extractFromClickedElement.mockResolvedValueOnce({
      success: true,
      mediaItems: [sampleMediaItem],
      clickedIndex: 0,
    });

    await handlers.onMediaClick(
      sampleMediaItem,
      document.createElement('div'),
      new globalThis.MouseEvent('click')
    );

    expect(openGalleryMock).toHaveBeenCalledWith([sampleMediaItem], 0);

    closeHandler();
    expect(closeGalleryMock).toHaveBeenCalledTimes(1);
    expect(mediaServiceMock.restoreBackgroundVideos).toHaveBeenCalledTimes(1);
  });

  it('opens gallery with normalized index and ensures container existence', async () => {
    setupSignalsMock();
    setupEventsMock();
    setupIsolationMock();

    const app = await createGalleryApp();
    await app.initialize();

    await app.openGallery([sampleMediaItem], 10);

    expect(openGalleryMock).toHaveBeenCalledWith([sampleMediaItem], 0);
    expect(document.querySelector('#xeg-gallery-root')).not.toBeNull();
  });

  it('cleanup tears down events and unmounts container', async () => {
    setupSignalsMock();
    setupEventsMock();
    setupIsolationMock();

    const app = await createGalleryApp();
    await app.initialize();

    await app.openGallery([sampleMediaItem], 0);
    expect(document.querySelector('#xeg-gallery-root')).not.toBeNull();

    await app.cleanup();

    expect(cleanupEventsMock).toHaveBeenCalledTimes(1);
    expect(unmountGalleryMock).toHaveBeenCalledTimes(1);
    expect(document.querySelector('#xeg-gallery-root')).toBeNull();
  });
});
