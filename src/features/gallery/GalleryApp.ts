/**
 * @fileoverview Gallery Application
 * @description Gallery application orchestrator
 */

import {
  getGalleryRenderer,
  getMediaService,
  tryGetSettingsManager,
} from '@shared/container/service-accessors';
import { galleryErrorReporter, mediaErrorReporter } from '@shared/error/app-error-reporter';
import { getErrorMessage } from '@shared/error/normalize';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { logger } from '@shared/logging';
import { NotificationService } from '@shared/services/notification-service';
import { closeGallery, gallerySignals, openGallery } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import {
  cleanupGalleryEvents,
  initializeGalleryEvents,
} from '@shared/utils/events/lifecycle/gallery-lifecycle';
import {
  type AmbientVideoPauseRequest,
  pauseAmbientVideosForGallery,
} from '@shared/utils/media/ambient-video-coordinator';
import { startAmbientVideoGuard } from '@shared/utils/media/ambient-video-guard';
import { clampIndex } from '@shared/utils/types/safety';

interface GalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

interface GalleryOpenOptions {
  readonly pauseContext?: AmbientVideoPauseRequest;
}

export class GalleryApp {
  private galleryRenderer: GalleryRenderer | null = null;
  private isInitialized = false;
  private readonly notificationService = NotificationService.getInstance();
  private ambientVideoGuardDispose: (() => void) | null = null;

  constructor() {
    __DEV__ && logger.info('[GalleryApp] Constructor called');
  }

  public async initialize(): Promise<void> {
    try {
      __DEV__ && logger.info('[GalleryApp] Initialization started');

      this.galleryRenderer = getGalleryRenderer();
      this.galleryRenderer?.setOnCloseCallback(() => this.closeGallery());

      await this.setupEventHandlers();
      this.ambientVideoGuardDispose = this.ambientVideoGuardDispose ?? startAmbientVideoGuard();

      this.isInitialized = true;
      __DEV__ && logger.info('[GalleryApp] ✅ Initialization complete');
    } catch (error) {
      galleryErrorReporter.critical(error, {
        code: 'GALLERY_APP_INIT_FAILED',
      });
    }
  }

  private async setupEventHandlers(): Promise<void> {
    try {
      const settingsService = tryGetSettingsManager<{ get: (key: string) => boolean }>();
      const enableKeyboard = settingsService?.get('gallery.enableKeyboardNav') ?? true;

      await initializeGalleryEvents(
        {
          onMediaClick: (element, event) => this.handleMediaClick(element, event),
          onGalleryClose: () => this.closeGallery(),
          onKeyboardEvent: (event) => {
            if (event.key === 'Escape' && gallerySignals.isOpen.value) {
              this.closeGallery();
            }
          },
        },
        {
          enableKeyboard,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: 'gallery',
        }
      );

      __DEV__ && logger.info('[GalleryApp] ✅ Event handlers setup complete');
    } catch (error) {
      galleryErrorReporter.critical(error, {
        code: 'EVENT_HANDLERS_SETUP_FAILED',
      });
    }
  }

  private async handleMediaClick(element: HTMLElement, _event?: MouseEvent): Promise<void> {
    try {
      const mediaService = getMediaService();
      const result = await mediaService.extractFromClickedElement(element);

      if (result.success && result.mediaItems.length > 0) {
        await this.openGallery(result.mediaItems, result.clickedIndex, {
          pauseContext: {
            sourceElement: element,
            reason: 'media-click',
          },
        });
      } else {
        mediaErrorReporter.warn(new Error('Media extraction returned no items'), {
          code: 'MEDIA_EXTRACTION_EMPTY',
          metadata: { success: result.success },
        });
        this.notificationService.error('Failed to load media', 'Could not find images or videos.');
      }
    } catch (error) {
      mediaErrorReporter.error(error, {
        code: 'MEDIA_EXTRACTION_ERROR',
        notify: true,
      });
      this.notificationService.error('Error occurred', getErrorMessage(error) || 'Unknown error');
    }
  }

  public async openGallery(
    mediaItems: MediaInfo[],
    startIndex: number = 0,
    options: GalleryOpenOptions = {}
  ): Promise<void> {
    if (!this.isInitialized) {
      __DEV__ && logger.warn('[GalleryApp] Gallery not initialized.');
      this.notificationService.error('Gallery unavailable', 'Userscript manager required.');
      return;
    }

    if (!mediaItems?.length) return;

    try {
      const validIndex = clampIndex(startIndex, mediaItems.length);

      const providedContext = options.pauseContext ?? null;
      const pauseContext: AmbientVideoPauseRequest = {
        ...providedContext,
        reason: providedContext?.reason ?? (providedContext ? 'media-click' : 'programmatic'),
      };

      try {
        pauseAmbientVideosForGallery(pauseContext);
      } catch (error) {
        __DEV__ && logger.warn('[GalleryApp] Ambient video coordinator failed', error);
      }

      openGallery(mediaItems, validIndex);
    } catch (error) {
      galleryErrorReporter.error(error, {
        code: 'GALLERY_OPEN_FAILED',
        metadata: { itemCount: mediaItems.length, startIndex },
        notify: true,
      });
      this.notificationService.error(
        'Failed to load gallery',
        getErrorMessage(error) || 'Unknown error'
      );
      throw error;
    }
  }

  public closeGallery(): void {
    try {
      if (gallerySignals.isOpen.value) {
        closeGallery();
      }
    } catch (error) {
      galleryErrorReporter.error(error, {
        code: 'GALLERY_CLOSE_FAILED',
      });
    }
  }

  public async cleanup(): Promise<void> {
    try {
      __DEV__ && logger.info('[GalleryApp] Cleanup started');

      if (gallerySignals.isOpen.value) {
        this.closeGallery();
      }

      this.ambientVideoGuardDispose?.();
      this.ambientVideoGuardDispose = null;

      try {
        cleanupGalleryEvents();
      } catch (error) {
        __DEV__ && logger.warn('[GalleryApp] Event cleanup failed:', error);
      }

      this.galleryRenderer = null;
      this.isInitialized = false;

      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
      __DEV__ && logger.info('[GalleryApp] ✅ Cleanup complete');
    } catch (error) {
      galleryErrorReporter.error(error, {
        code: 'GALLERY_CLEANUP_FAILED',
      });
    }
  }
}
