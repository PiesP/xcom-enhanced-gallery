/**
 * @fileoverview Gallery Application
 * @description Gallery application orchestrator - initialization, event binding, lifecycle management
 * @module features/gallery
 *
 * Responsibilities:
 * - Gallery initialization and lifecycle management
 * - Media service and renderer orchestration
 * - Event handler registration/cleanup
 * - User notification management via Tampermonkey
 */

import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';
import {
  getGalleryRenderer,
  getMediaServiceFromContainer,
} from '@shared/container/service-accessors';
import {
  gallerySignals,
  openGallery,
  closeGallery,
} from '@shared/state/signals/gallery.signals';
import type { MediaInfo } from '@shared/types/media.types';
import { logger } from '@shared/logging';
import { MediaService } from '@shared/services/media-service';
import { NotificationService } from '@shared/services/notification-service';
import { isGMAPIAvailable } from '@shared/external/userscript';
import type { SettingsService } from '@features/settings/services/settings-service';
import type { ThemeServiceContract, ThemeSetting } from '@shared/services/theme-service';
import { pauseActiveTwitterVideos } from '@shared/utils/media/twitter-video-pauser';

/**
 * Gallery app configuration interface
 */
export interface GalleryConfig {
  autoTheme?: boolean;
  keyboardShortcuts?: boolean;
  extractionTimeout?: number;
  clickDebounceMs?: number;
}

/**
 * Gallery application orchestrator
 */
export class GalleryApp {
  private mediaService: MediaService | null = null;
  private galleryRenderer: GalleryRenderer | null = null;
  private settingsService: SettingsService | null = null;
  private isInitialized = false;
  private readonly notificationService = NotificationService.getInstance();
  private readonly config: GalleryConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    extractionTimeout: 15000,
    clickDebounceMs: 500,
  };

  constructor() {
    logger.info('[GalleryApp] Constructor called');
  }

  /**
   * Lazy initialization of media service
   */
  private async getMediaService(): Promise<MediaService> {
    if (!this.mediaService) {
      const service = getMediaServiceFromContainer();
      if (!(service instanceof MediaService)) {
        throw new Error('MediaService not available from container');
      }

      this.mediaService = service;
    }
    return this.mediaService;
  }

  /**
   * Gallery app initialization
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('[GalleryApp] Initialization started');

      // Phase 317: Environment guard - Check Tampermonkey API availability
      // Phase 420: Simplified check - PersistentStorage handles missing APIs gracefully
      // We only warn if absolutely no storage capability is detected, but proceed anyway
      // to allow basic functionality (viewing) even if settings/download might fail.
      const hasRequiredGMAPIs = isGMAPIAvailable('download') || isGMAPIAvailable('setValue');
      if (!hasRequiredGMAPIs) {
        logger.warn('[GalleryApp] Tampermonkey APIs limited - some features may be unavailable');
      }

      // Phase 258: Delayed SettingsService load (bootstrap optimization)
      // Removed from bootstrap/features.ts, loaded here
      // Phase 420: Simplified initialization
      try {
        const { SettingsService } = await import('@features/settings/services/settings-service');
        const { registerSettingsManager } = await import('@shared/container/service-accessors');

        const settingsService = new SettingsService();
        await settingsService.initialize();
        registerSettingsManager(settingsService);
        this.settingsService = settingsService;
        logger.debug('[GalleryApp] ✅ SettingsService initialized');
      } catch (error) {
        logger.warn('[GalleryApp] SettingsService initialization failed (non-critical):', error);
      }

      // Phase 415: Verify theme initialization and sync from SettingsService
      try {
        // Phase 360: Use ThemeService (already initialized in base-services)
        const { getThemeService } = await import('@shared/container/service-accessors');
        const themeService = getThemeService();

        // Ensure ThemeService is initialized (loads settings asynchronously)
        if (!themeService.isInitialized()) {
          await themeService.initialize();
        }

        // Sync theme from SettingsService to ThemeService if SettingsService is initialized
        if (this.settingsService) {
          themeService.bindSettingsService(
            this
              .settingsService as unknown as import('@shared/services/theme-service').SettingsServiceLike
          );

          this.reapplyStoredTheme(themeService);
        }

        logger.debug(`[GalleryApp] Theme confirmed: ${themeService.getCurrentTheme()}`);
      } catch (error) {
        logger.warn('[GalleryApp] Theme check/sync failed (non-critical):', error);
      }

      await this.initializeRenderer();
      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info('[GalleryApp] ✅ Initialization complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Gallery renderer initialization
   */
  private async initializeRenderer(): Promise<void> {
    this.galleryRenderer = getGalleryRenderer();
    this.galleryRenderer?.setOnCloseCallback(() => {
      this.closeGallery();
    });
    logger.debug('[GalleryApp] Gallery renderer initialization complete');
  }

  /**
   * Event handler setup
   */
  private async setupEventHandlers(): Promise<void> {
    try {
      const { initializeGalleryEvents } = await import('@shared/utils/events');

      // Get settings if available
      const enableKeyboard = this.settingsService
        ? (this.settingsService.get<boolean>('gallery.enableKeyboardNav') ?? true)
        : true;

      await initializeGalleryEvents(
        {
          onMediaClick: async (_mediaInfo, element) => {
            try {
              const mediaService = await this.getMediaService();
              const result = await mediaService.extractFromClickedElement(element);

              if (result.success && result.mediaItems.length > 0) {
                await this.openGallery(result.mediaItems, result.clickedIndex);
              } else {
                logger.warn('[GalleryApp] Media extraction failed:', {
                  success: result.success,
                  mediaCount: result.mediaItems.length,
                });
                void this.notificationService.error(
                  'Failed to load media',
                  'Could not find images or videos.'
                );
              }
            } catch (error) {
              logger.error('[GalleryApp] Error during media extraction:', error);
              void this.notificationService.error(
                'Error occurred',
                error instanceof Error ? error.message : 'Unknown error'
              );
            }
          },
          onGalleryClose: () => {
            this.closeGallery();
          },
          onKeyboardEvent: event => {
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

      logger.info('[GalleryApp] ✅ Event handlers setup complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Event handlers setup failed:', error);
      throw error;
    }
  }

  private reapplyStoredTheme(themeService: ThemeServiceContract): void {
    if (!this.settingsService) {
      return;
    }

    const storedTheme = this.settingsService.get<ThemeSetting>('gallery.theme');
    const isExplicitTheme = storedTheme === 'light' || storedTheme === 'dark';

    if (!isExplicitTheme) {
      logger.debug(
        '[GalleryApp] Stored theme is not explicitly light/dark; skipping manual reapply'
      );
      return;
    }

    themeService.setTheme(storedTheme, { force: true, persist: false });
    logger.info(`[GalleryApp] Applied stored ${storedTheme} theme at startup`);
  }

  /**
   * Open gallery
   */
  public async openGallery(mediaItems: MediaInfo[], startIndex: number = 0): Promise<void> {
    // Phase 317: Environment guard - Check for Tampermonkey availability
    if (!this.isInitialized) {
      logger.warn('[GalleryApp] Gallery not initialized. Tampermonkey may not be installed.');
      void this.notificationService.error(
        'Gallery unavailable',
        'Tampermonkey or similar userscript manager is required.'
      );
      return;
    }

    if (!mediaItems?.length) {
      logger.warn('Failed to open gallery: no media items');
      return;
    }

    try {
      const validIndex = Math.max(0, Math.min(startIndex, mediaItems.length - 1));
      logger.info('[GalleryApp] Opening gallery:', {
        mediaCount: mediaItems.length,
        startIndex: validIndex,
      });

      try {
        pauseActiveTwitterVideos();
      } catch (error) {
        logger.warn('[GalleryApp] Ambient video pause failed (non-blocking)', error);
      }

      // Update state (renderer auto-renders via signal subscription)
      openGallery(mediaItems, validIndex);
    } catch (error) {
      logger.error('[GalleryApp] Failed to open gallery:', error);
      void this.notificationService.error(
        'Failed to load gallery',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Close gallery
   */
  public closeGallery(): void {
    try {
      if (gallerySignals.isOpen.value) {
        closeGallery();
      }
      logger.debug('[GalleryApp] Gallery closed');
    } catch (error) {
      logger.error('[GalleryApp] Failed to close gallery:', error);
    }
  }

  // Legacy test compatibility APIs (no-op or derived) — Phase 289 test bridging
  /**
   * Returns whether the app is initialized and gallery renderer is ready.
   * Kept for backward-compatible tests.
   */
  public isRunning(): boolean {
    return this.isInitialized === true;
  }

  /**
   * Shallow-merge new configuration. Kept for backward-compatible tests.
   */
  public updateConfig(partial: Partial<GalleryConfig>): void {
    Object.assign(this.config, partial);
  }

  /**
   * Get diagnostic information about gallery state and initialization
   */
  public getDiagnostics() {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      galleryState: {
        isOpen: gallerySignals.isOpen.value,
        mediaCount: gallerySignals.mediaItems.value.length,
        currentIndex: gallerySignals.currentIndex.value,
      },
    };
  }

  /**
   * Complete cleanup - Dispose renderer and reset state
   */
  public async cleanup(): Promise<void> {
    try {
      logger.info('[GalleryApp] Cleanup started');

      if (gallerySignals.isOpen.value) {
        this.closeGallery();
      }

      try {
        const { cleanupGalleryEvents } = await import('@shared/utils/events');
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
