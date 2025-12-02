/**
 * @fileoverview Comprehensive tests for GalleryApp
 * @description Tests for the gallery application orchestrator
 */

import type { MediaInfo } from '@shared/types/media.types';
import { GalleryApp } from '@features/gallery/GalleryApp';
import { logger } from '@shared/logging';
import { galleryErrorReporter, mediaErrorReporter } from '@shared/error';
import * as serviceAccessors from '@shared/container/service-accessors';

// Hoisted mocks
const mockGalleryRenderer = vi.hoisted(() => ({
  setOnCloseCallback: vi.fn(),
}));

const mockMediaService = vi.hoisted(() => ({
  extractFromClickedElement: vi.fn(),
}));

const mockNotificationService = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

const mockGallerySignals = vi.hoisted(() => ({
  isOpen: { value: false },
  mediaItems: { value: [] },
  currentIndex: { value: 0 },
  isLoading: { value: false },
  error: { value: null },
  viewMode: { value: 'vertical' },
}));

const mockOpenGallery = vi.hoisted(() => vi.fn());
const mockCloseGallery = vi.hoisted(() => vi.fn());
const mockPauseActiveTwitterVideos = vi.hoisted(() => vi.fn());
const mockInitializeGalleryEvents = vi.hoisted(() => vi.fn());
const mockCleanupGalleryEvents = vi.hoisted(() => vi.fn());

// Mock dependencies
vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@shared/services/notification-service', () => ({
  NotificationService: {
    getInstance: () => mockNotificationService,
  },
}));

vi.mock('@shared/container/service-accessors', () => ({
  getGalleryRenderer: () => mockGalleryRenderer,
  getMediaService: () => mockMediaService,
  tryGetSettingsManager: () => ({
    get: (key: string) => key === 'gallery.enableKeyboardNav' ? true : false,
  }),
}));

vi.mock('@shared/error', () => ({
  galleryErrorReporter: {
    critical: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  mediaErrorReporter: {
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: mockGallerySignals,
  openGallery: mockOpenGallery,
  closeGallery: mockCloseGallery,
}));

vi.mock('@shared/utils/media/twitter-video-pauser', () => ({
  pauseActiveTwitterVideos: mockPauseActiveTwitterVideos,
}));

vi.mock('@shared/utils/events/lifecycle/gallery-lifecycle', () => ({
  initializeGalleryEvents: mockInitializeGalleryEvents,
  cleanupGalleryEvents: mockCleanupGalleryEvents,
}));

describe('GalleryApp', () => {
  let app: GalleryApp;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGallerySignals.isOpen.value = false;
    mockInitializeGalleryEvents.mockResolvedValue(undefined);
    mockCleanupGalleryEvents.mockReturnValue(undefined);
    app = new GalleryApp();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with default state', () => {
      const galleryApp = new GalleryApp();
      expect(galleryApp).toBeDefined();
    });

    it('should call logger.info during construction', () => {
      vi.clearAllMocks();
      // construct instance - not referenced further to satisfy lint/type rules
      new GalleryApp();
      expect(logger.info).toHaveBeenCalledWith('[GalleryApp] Constructor called');
    });
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await app.initialize();

      expect(mockGalleryRenderer.setOnCloseCallback).toHaveBeenCalled();
      expect(mockInitializeGalleryEvents).toHaveBeenCalled();
    });

    it('should set up onClose callback on gallery renderer', async () => {
      await app.initialize();

      expect(mockGalleryRenderer.setOnCloseCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should pass event handlers to initializeGalleryEvents', async () => {
      await app.initialize();

      expect(mockInitializeGalleryEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          onMediaClick: expect.any(Function),
          onGalleryClose: expect.any(Function),
          onKeyboardEvent: expect.any(Function),
        }),
        expect.objectContaining({
          enableKeyboard: true,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: 'gallery',
        }),
      );
    });

    it('should throw error if initialization fails', async () => {
      const error = new Error('Init failed');
      mockInitializeGalleryEvents.mockRejectedValue(error);

      // Make the critical error reporter throw to emulate runtime behavior
      vi.spyOn(galleryErrorReporter, 'critical').mockImplementation(() => {
        throw error;
      });

      await expect(app.initialize()).rejects.toThrow('Init failed');

      expect(galleryErrorReporter.critical).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ code: 'EVENT_HANDLERS_SETUP_FAILED' }),
      );
      expect(galleryErrorReporter.critical).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ code: 'GALLERY_APP_INIT_FAILED' }),
      );
    });

    it('should not call setOnCloseCallback when gallery renderer is null', async () => {
      vi.spyOn(serviceAccessors, 'getGalleryRenderer').mockImplementation(() => null as any);
      const localApp = new GalleryApp();

      await expect(localApp.initialize()).resolves.not.toThrow();
      expect(mockGalleryRenderer.setOnCloseCallback).not.toHaveBeenCalled();
    });

    it('should default enableKeyboard true when tryGetSettingsManager returns undefined', async () => {
      vi.spyOn(serviceAccessors, 'tryGetSettingsManager').mockImplementation(() => undefined as any);
      const localApp = new GalleryApp();

      await localApp.initialize();

      expect(mockInitializeGalleryEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          onMediaClick: expect.any(Function),
          onGalleryClose: expect.any(Function),
          onKeyboardEvent: expect.any(Function),
        }),
        expect.objectContaining({ enableKeyboard: true }),
      );
    });

    it('should pass enableKeyboard false when tryGetSettingsManager returns false', async () => {
      vi.spyOn(serviceAccessors, 'tryGetSettingsManager').mockImplementation(() => ({ get: () => false } as any));
      const localApp = new GalleryApp();

      await localApp.initialize();

      expect(mockInitializeGalleryEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          onMediaClick: expect.any(Function),
          onGalleryClose: expect.any(Function),
          onKeyboardEvent: expect.any(Function),
        }),
        expect.objectContaining({ enableKeyboard: false }),
      );
    });
  });

  describe('openGallery', () => {
    const mockMediaItems: MediaInfo[] = [
      { id: 'media_1', url: 'https://example.com/image1.jpg', type: 'image' },
      { id: 'media_2', url: 'https://example.com/image2.jpg', type: 'image' },
    ];

    beforeEach(async () => {
      await app.initialize();
    });

    it('should open gallery with media items', async () => {
      await app.openGallery(mockMediaItems, 0);

      expect(mockOpenGallery).toHaveBeenCalledWith(mockMediaItems, 0);
    });

    it('should pause active Twitter videos before opening', async () => {
      await app.openGallery(mockMediaItems, 0);

      expect(mockPauseActiveTwitterVideos).toHaveBeenCalled();
    });

    it('should clamp start index to valid range', async () => {
      await app.openGallery(mockMediaItems, 10);

      expect(mockOpenGallery).toHaveBeenCalledWith(mockMediaItems, 1);
    });

    it('should handle negative start index', async () => {
      await app.openGallery(mockMediaItems, -5);

      expect(mockOpenGallery).toHaveBeenCalledWith(mockMediaItems, 0);
    });

    it('should not open gallery if not initialized', async () => {
      const uninitializedApp = new GalleryApp();

      await uninitializedApp.openGallery(mockMediaItems, 0);

      expect(mockOpenGallery).not.toHaveBeenCalled();
      expect(mockNotificationService.error).toHaveBeenCalled();
    });

    it('should not open gallery with empty media items', async () => {
      await app.openGallery([], 0);

      expect(mockOpenGallery).not.toHaveBeenCalled();
    });

    it('should not open gallery with null/undefined media items', async () => {
      await app.openGallery(null as unknown as MediaInfo[], 0);

      expect(mockOpenGallery).not.toHaveBeenCalled();
    });

    it('should handle pauseActiveTwitterVideos failure gracefully', async () => {
      mockPauseActiveTwitterVideos.mockImplementation(() => {
        throw new Error('Pause failed');
      });

      await app.openGallery(mockMediaItems, 0);

      expect(mockOpenGallery).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('[GalleryApp] Ambient video pause failed', expect.anything());
    });

    it('should handle openGallery signal error', async () => {
      mockOpenGallery.mockImplementation(() => {
        throw new Error('Signal error');
      });

      await expect(app.openGallery(mockMediaItems, 0)).rejects.toThrow('Signal error');
      expect(mockNotificationService.error).toHaveBeenCalled();
      expect(galleryErrorReporter.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ code: 'GALLERY_OPEN_FAILED' }),
      );
      expect(galleryErrorReporter.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ metadata: expect.objectContaining({ itemCount: mockMediaItems.length, startIndex: 0 })}),
      );
    });

    it('should use default startIndex of 0', async () => {
      mockOpenGallery.mockReset();

      await app.openGallery(mockMediaItems);

      expect(mockOpenGallery).toHaveBeenCalledWith(mockMediaItems, 0);
    });
  });

  describe('closeGallery', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should close gallery when open', () => {
      mockGallerySignals.isOpen.value = true;

      app.closeGallery();

      expect(mockCloseGallery).toHaveBeenCalled();
    });

    it('should not close gallery when already closed', () => {
      mockGallerySignals.isOpen.value = false;

      app.closeGallery();

      expect(mockCloseGallery).not.toHaveBeenCalled();
    });

    it('should handle close error gracefully', () => {
      mockGallerySignals.isOpen.value = true;
      mockCloseGallery.mockImplementation(() => {
        throw new Error('Close failed');
      });

      // Should not throw
      expect(() => app.closeGallery()).not.toThrow();
      expect(galleryErrorReporter.error).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ code: 'GALLERY_CLOSE_FAILED' }),
      );
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should cleanup resources', async () => {
      await app.cleanup();

      expect(mockCleanupGalleryEvents).toHaveBeenCalled();
      expect((app as any).isInitialized).toBe(false);
    });

    it('should close gallery if open during cleanup', async () => {
      mockGallerySignals.isOpen.value = true;

      await app.cleanup();

      expect(mockCloseGallery).toHaveBeenCalled();
    });

    it('should not close gallery when it is already closed during cleanup', async () => {
      mockGallerySignals.isOpen.value = false;

      await app.cleanup();

      expect(mockCloseGallery).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockCleanupGalleryEvents.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      // Should not throw
      await expect(app.cleanup()).resolves.not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith('[GalleryApp] Event cleanup failed:', expect.anything());
    });

    it('should report cleanup failures to error reporter when outer try catches', async () => {
      // Force top-level cleanup try to throw
      const testError = new Error('Outer cleanup failed');
      const spy = vi.spyOn(logger, 'info').mockImplementation(() => {
        throw testError;
      });

      try {
        await app.cleanup();
      } finally {
        spy.mockRestore();
      }

      expect(galleryErrorReporter.error).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({ code: 'GALLERY_CLEANUP_FAILED' }),
      );
    });

    it('should delete xegGalleryDebug from globalThis', async () => {
      (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug = { test: true };

      await app.cleanup();

      expect((globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug).toBeUndefined();
    });
  });

  describe('handleMediaClick (via event handlers)', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should extract and open gallery on successful media click', async () => {
      const mockElement = document.createElement('img');
      const mockMediaItems: MediaInfo[] = [
        { id: '1', url: 'https://example.com/image.jpg', type: 'image' },
      ];

      mockMediaService.extractFromClickedElement.mockResolvedValue({
        success: true,
        mediaItems: mockMediaItems,
        clickedIndex: 0,
      });

      // Get the onMediaClick callback
      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockOpenGallery).toHaveBeenCalledWith(mockMediaItems, 0);
    });

    it('should show notification on extraction failure', async () => {
      const mockElement = document.createElement('img');

      mockMediaService.extractFromClickedElement.mockResolvedValue({
        success: false,
        mediaItems: [],
        clickedIndex: 0,
      });

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Failed to load media',
        'Could not find images or videos.',
      );
      expect(mediaErrorReporter.warn).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: expect.objectContaining({ success: false }),
        }),
      );
    });

    it('should show notification on extraction error', async () => {
      const mockElement = document.createElement('img');

      mockMediaService.extractFromClickedElement.mockRejectedValue(
        new Error('Extraction error'),
      );

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Error occurred',
        'Extraction error',
      );
      expect(mediaErrorReporter.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ code: 'MEDIA_EXTRACTION_ERROR', notify: true }),
      );
    });

    it('should handle non-Error extraction errors', async () => {
      const mockElement = document.createElement('img');

      mockMediaService.extractFromClickedElement.mockRejectedValue('String error');

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Error occurred',
        'Unknown error',
      );
    });

    it('should show notification on success with empty media items', async () => {
      const mockElement = document.createElement('img');

      mockMediaService.extractFromClickedElement.mockResolvedValue({
        success: true,
        mediaItems: [],
        clickedIndex: 0,
      });

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Failed to load media',
        'Could not find images or videos.',
      );
      expect(mockOpenGallery).not.toHaveBeenCalled();
      expect(mediaErrorReporter.warn).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: expect.objectContaining({ success: true }),
        }),
      );
    });

    it('should show notification if success false but media items are present', async () => {
      const mockElement = document.createElement('img');
      const mockMediaItems: MediaInfo[] = [
        { id: '1', url: 'https://example.com/image.jpg', type: 'image' },
      ];

      mockMediaService.extractFromClickedElement.mockResolvedValue({
        success: false,
        mediaItems: mockMediaItems,
        clickedIndex: 0,
      });

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      await eventConfig!.onMediaClick(mockElement, new MouseEvent('click'));

      expect(mockNotificationService.error).toHaveBeenCalledWith(
        'Failed to load media',
        'Could not find images or videos.',
      );
      expect(mockOpenGallery).not.toHaveBeenCalled();
      expect(mediaErrorReporter.warn).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: expect.objectContaining({ success: false }),
        }),
      );
    });
  });

  describe('keyboard event handling', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should close gallery on Escape key when gallery is open', async () => {
      mockGallerySignals.isOpen.value = true;

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      eventConfig!.onKeyboardEvent({ key: 'Escape' });

      expect(mockCloseGallery).toHaveBeenCalled();
    });

    it('should not close gallery on Escape key when gallery is closed', async () => {
      mockGallerySignals.isOpen.value = false;

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      eventConfig!.onKeyboardEvent({ key: 'Escape' });

      expect(mockCloseGallery).not.toHaveBeenCalled();
    });

    it('should not close gallery on other keys', async () => {
      mockGallerySignals.isOpen.value = true;

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      eventConfig!.onKeyboardEvent({ key: 'Enter' });

      expect(mockCloseGallery).not.toHaveBeenCalled();
    });
  });

  describe('onClose callback', () => {
    it('should trigger closeGallery when callback is invoked', async () => {
      mockGallerySignals.isOpen.value = true;
      await app.initialize();

      const closeCallback = mockGalleryRenderer.setOnCloseCallback.mock.calls[0]?.[0];
      expect(closeCallback).toBeDefined();
      closeCallback!();

      expect(mockCloseGallery).toHaveBeenCalled();
    });

    it('should trigger closeGallery when initializeGalleryEvents onGalleryClose is invoked', async () => {
      mockGallerySignals.isOpen.value = true;
      await app.initialize();

      const eventConfig = mockInitializeGalleryEvents.mock.calls[0]?.[0];
      expect(eventConfig).toBeDefined();
      eventConfig!.onGalleryClose();

      expect(mockCloseGallery).toHaveBeenCalled();
    });
  });
});
