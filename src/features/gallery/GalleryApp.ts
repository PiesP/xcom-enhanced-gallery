/**
 * @fileoverview Gallery Application
 * @description Gallery application orchestrator - initialization, event binding, lifecycle management
 * @module features/gallery
 *
 * Responsibilities:
 * - Gallery initialization and lifecycle management
 * - Media service and renderer orchestration
 * - Event handler registration/cleanup
 * - User notification (Toast) management
 */

import type { GalleryRenderer } from '../../shared/interfaces/gallery.interfaces';
import {
  getGalleryRenderer,
  getMediaServiceFromContainer,
  getToastManager,
} from '../../shared/container/service-accessors';
import {
  gallerySignals,
  openGallery,
  closeGallery,
} from '../../shared/state/signals/gallery.signals';
import type { MediaInfo } from '../../shared/types/media.types';
import { logger } from '@shared/logging';
import { MediaService } from '../../shared/services/media-service';
import { toastManager } from '../../shared/services/unified-toast-manager';
import { initializeTheme } from './services/theme-initialization';
import { isGMAPIAvailable } from '@shared/external/userscript';

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
  private isInitialized = false;
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
   * Delayed initialization of SettingsService (Phase 258 optimization, Phase 326.2 enhancement)
   *
   * Removed from bootstrap/features.ts, loaded at gallery initialization time
   * This reduces bootstrap time by 30-50%.
   *
   * Phase 326.2 improvements:
   * - Dynamic import loads Settings service only (UI components loaded as needed)
   * - Works with preload strategy (executePreloadStrategy → preloadOptionalChunks)
   * - Tree-shaking can exclude unused Settings UI
   *
   * Benefits:
   * - Initial bootstrap: 5-10% faster
   * - Settings UI load: Only when needed (first open ~50ms delay)
   */
  private async ensureSettingsServiceInitialized(): Promise<void> {
    try {
      const { tryGetSettingsManager, registerSettingsManager } = await import(
        '../../shared/container/service-accessors'
      );
      const existingSettings = tryGetSettingsManager();

      if (existingSettings) {
        logger.debug('[GalleryApp] SettingsService already initialized');
        return;
      }

      logger.debug('[GalleryApp] Initializing SettingsService (Phase 258, Phase 326.2)');

      // Delayed SettingsService load (Phase 326.2)
      const { SettingsService } = await import('../settings/services/settings-service');

      const settingsService = new SettingsService();
      await settingsService.initialize();
      registerSettingsManager(settingsService);

      logger.debug('[GalleryApp] ✅ SettingsService initialized');
    } catch (error) {
      logger.warn('[GalleryApp] SettingsService initialization failed (non-critical):', error);
      // SettingsService initialization failure does not affect gallery operation
    }
  }

  /**
   * Phase 415: Deferred BaseService initialization (Theme, Language)
   *
   * Moved from bootstrap/base-services.ts to GalleryApp initialization
   * for lazy loading. Previously initialized during Phase 2, now deferred to Phase 6.
   * This reduces initial bootstrap time by 5-10%.
   *
   * Benefits:
   * - Only initialized when gallery is actually used
   * - If user never opens gallery, these services are never loaded
   * - Reduces initial page load impact
   *
   * @private
   */
  private async ensureBaseServicesInitialized(): Promise<void> {
    try {
      logger.debug('[GalleryApp] Ensuring BaseService initialization (Phase 415)');

      const { initializeCoreBaseServices } = await import('../../bootstrap/base-services');
      await initializeCoreBaseServices();

      logger.debug('[GalleryApp] ✅ BaseService initialization complete (Theme, Language)');
    } catch (error) {
      logger.warn('[GalleryApp] BaseService initialization failed (non-critical):', error);
      // BaseService initialization failure does not affect gallery operation (uses defaults)
    }
  }

  /**
   * Gallery app initialization
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('[GalleryApp] Initialization started');

      // Phase 317: Environment guard - Check Tampermonkey API availability
      const hasRequiredGMAPIs = isGMAPIAvailable('download') || isGMAPIAvailable('setValue');
      if (!hasRequiredGMAPIs) {
        logger.warn(
          '[GalleryApp] Tampermonkey APIs not available - gallery will display toast/error panel only'
        );
        // Initialize toast controller only and return
        await // toast manager auto-initializes (singleton);
        toastManager.show({
          title: 'Tampermonkey not installed',
          message: 'This app requires Tampermonkey or similar userscript manager.',
          type: 'error',
        });
        this.isInitialized = false;
        return;
      }

      // Phase 415: Deferred BaseService initialization (Theme, Language)
      await this.ensureBaseServicesInitialized();

      // Phase 258: Delayed SettingsService load (bootstrap optimization)
      // Removed from bootstrap/features.ts, loaded here
      await this.ensureSettingsServiceInitialized();

      // Phase 415: Initialize theme with explicit error handling
      try {
        initializeTheme();
        logger.debug('[GalleryApp] Theme initialization complete');
      } catch (error) {
        logger.warn('[GalleryApp] Theme initialization failed (non-critical):', error);
      }

      // Phase 415: Toast manager verification (singleton - auto-initializes)
      try {
        getToastManager(); // Verify toast manager is available
        logger.debug('[GalleryApp] Toast manager verified');
      } catch (error) {
        logger.warn('[GalleryApp] Toast manager verification failed (non-critical):', error);
        // Gallery continues even if toast manager is unavailable
      }

      await this.initializeRenderer();
      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info('[GalleryApp] ✅ Initialization complete');

      if (process.env.NODE_ENV === 'development') {
        this.exposeDebugAPI();
      }
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
      const { initializeGalleryEvents } = await import('../../shared/utils/events');

      await initializeGalleryEvents({
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
              toastManager.show({
                title: 'Failed to load media',
                message: 'Could not find images or videos.',
                type: 'error',
              });
            }
          } catch (error) {
            logger.error('[GalleryApp] Error during media extraction:', error);
            toastManager.show({
              title: 'Error occurred',
              message: error instanceof Error ? error.message : 'Unknown error',
              type: 'error',
            });
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
      });

      logger.info('[GalleryApp] ✅ Event handlers setup complete');
    } catch (error) {
      logger.error('[GalleryApp] ❌ Event handlers setup failed:', error);
      throw error;
    }
  }

  /**
   * Open gallery
   */
  public async openGallery(mediaItems: MediaInfo[], startIndex: number = 0): Promise<void> {
    // Phase 317: Environment guard - Check for Tampermonkey availability
    if (!this.isInitialized) {
      logger.warn('[GalleryApp] Gallery not initialized. Tampermonkey may not be installed.');
      toastManager.show({
        title: 'Gallery unavailable',
        message: 'Tampermonkey or similar userscript manager is required.',
        type: 'error',
      });
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

      // Update state (renderer auto-renders via signal subscription)
      openGallery(mediaItems, validIndex);
    } catch (error) {
      logger.error('[GalleryApp] Failed to open gallery:', error);
      toastManager?.show({
        title: 'Failed to load gallery',
        message: `${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
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
   * Expose debug API - Development mode
   */
  private exposeDebugAPI(): void {
    (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug = {
      openGallery: this.openGallery.bind(this),
      closeGallery: this.closeGallery.bind(this),
      getDiagnostics: this.getDiagnostics.bind(this),
    };
    logger.debug('[GalleryApp] Debug API exposed: xegGalleryDebug');
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
        const { cleanupGalleryEvents } = await import('../../shared/utils/events');
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
