/**
 * @fileoverview Gallery Application
 * @description Gallery application orchestrator
 */

import {
  getGalleryRenderer,
  getMediaService,
  tryGetSettingsManager,
} from '@shared/container/service-accessors';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import { logger } from '@shared/logging';
import { NotificationService } from '@shared/services/notification-service';
import { closeGallery, gallerySignals, openGallery } from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { pauseActiveTwitterVideos } from '@shared/utils/media/twitter-video-pauser';

export interface GalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

export class GalleryApp {
  private galleryRenderer: GalleryRenderer | null = null;
  private isInitialized = false;
  private readonly notificationService = NotificationService.getInstance();

  constructor() {
    logger.info('[GalleryApp] Constructor called');
  }

  public async initialize(): Promise<void> {
    try {
      logger.info('[GalleryApp] Initialization started');

      this.galleryRenderer = getGalleryRenderer();
      this.galleryRenderer?.setOnCloseCallback(() => this.closeGallery());

      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info('[GalleryApp] ✅ Initialization complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Initialization failed:', error);
      throw error;
    }
  }

  private async setupEventHandlers(): Promise<void> {
    try {
      const { initializeGalleryEvents } = await import(
        '@shared/utils/events/lifecycle/gallery-lifecycle'
      );

      const settingsService = tryGetSettingsManager<{ get: (key: string) => boolean }>();
      const enableKeyboard = settingsService?.get('gallery.enableKeyboardNav') ?? true;

      await initializeGalleryEvents(
        {
          onMediaClick: (mediaInfo, element) => this.handleMediaClick(mediaInfo, element),
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
        },
      );

      logger.info('[GalleryApp] ✅ Event handlers setup complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Event handlers setup failed:', error);
      throw error;
    }
  }

  private async handleMediaClick(_mediaInfo: unknown, element: HTMLElement): Promise<void> {
    try {
      const mediaService = getMediaService();
      const result = await mediaService.extractFromClickedElement(element);

      if (result.success && result.mediaItems.length > 0) {
        await this.openGallery(result.mediaItems, result.clickedIndex);
      } else {
        logger.warn('[GalleryApp] Media extraction failed:', { success: result.success });
        this.notificationService.error('Failed to load media', 'Could not find images or videos.');
      }
    } catch (error) {
      logger.error('[GalleryApp] Error during media extraction:', error);
      this.notificationService.error(
        'Error occurred',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  public async openGallery(mediaItems: MediaInfo[], startIndex: number = 0): Promise<void> {
    if (!this.isInitialized) {
      logger.warn('[GalleryApp] Gallery not initialized.');
      this.notificationService.error(
        'Gallery unavailable',
        'Tampermonkey or similar userscript manager is required.',
      );
      return;
    }

    if (!mediaItems?.length) return;

    try {
      const validIndex = Math.max(0, Math.min(startIndex, mediaItems.length - 1));

      try {
        pauseActiveTwitterVideos();
      } catch (error) {
        logger.warn('[GalleryApp] Ambient video pause failed', error);
      }

      openGallery(mediaItems, validIndex);
    } catch (error) {
      logger.error('[GalleryApp] Failed to open gallery:', error);
      this.notificationService.error(
        'Failed to load gallery',
        error instanceof Error ? error.message : 'Unknown error',
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
      logger.error('[GalleryApp] Failed to close gallery:', error);
    }
  }

  public async cleanup(): Promise<void> {
    try {
      logger.info('[GalleryApp] Cleanup started');

      if (gallerySignals.isOpen.value) {
        this.closeGallery();
      }

      try {
        const { cleanupGalleryEvents } = await import(
          '@shared/utils/events/lifecycle/gallery-lifecycle'
        );
        cleanupGalleryEvents();
      } catch (error) {
        logger.warn('[GalleryApp] Event cleanup failed:', error);
      }

      this.galleryRenderer = null;
      this.isInitialized = false;

      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
      logger.info('[GalleryApp] ✅ Cleanup complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Error during cleanup:', error);
    }
  }
}
