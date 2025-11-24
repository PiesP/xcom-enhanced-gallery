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

import {
  getGalleryRenderer,
  getMediaServiceFromContainer,
  tryGetSettingsManager,
} from "@shared/container/service-accessors";
import type { GalleryRenderer } from "@shared/interfaces/gallery.interfaces";
import { logger } from "@shared/logging";
import { MediaService } from "@shared/services/media-service";
import { NotificationService } from "@shared/services/notification-service";
import {
  closeGallery,
  gallerySignals,
  openGallery,
} from "@shared/state/signals/gallery.signals";
import type { MediaInfo } from "@shared/types/media.types";
import { pauseActiveTwitterVideos } from "@shared/utils/media/twitter-video-pauser";

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
  private galleryRenderer: GalleryRenderer | null = null;
  private isInitialized = false;
  private readonly notificationService = NotificationService.getInstance();
  private readonly config: GalleryConfig = {
    autoTheme: true,
    keyboardShortcuts: true,
    extractionTimeout: 15000,
    clickDebounceMs: 500,
  };

  constructor() {
    logger.info("[GalleryApp] Constructor called");
  }

  /**
   * Gallery app initialization
   */
  public async initialize(): Promise<void> {
    try {
      logger.info("[GalleryApp] Initialization started");

      // Renderer is already registered in bootstrap
      this.galleryRenderer = getGalleryRenderer();
      this.galleryRenderer?.setOnCloseCallback(() => {
        this.closeGallery();
      });

      await this.setupEventHandlers();

      this.isInitialized = true;
      logger.info("[GalleryApp] ✅ Initialization complete");
    } catch (error) {
      logger.error("[GalleryApp] ❌ Initialization failed:", error);
      throw error;
    }
  }

  /**
   * Event handler setup
   */
  private async setupEventHandlers(): Promise<void> {
    try {
      const { initializeGalleryEvents } = await import(
        "@shared/utils/events/lifecycle/gallery-lifecycle"
      );

      // Get settings if available
      const settingsService = tryGetSettingsManager<{
        get: (key: string) => boolean;
      }>();
      const enableKeyboard = settingsService
        ? (settingsService.get("gallery.enableKeyboardNav") ?? true)
        : true;

      await initializeGalleryEvents(
        {
          onMediaClick: (mediaInfo, element) =>
            this.handleMediaClick(mediaInfo, element),
          onGalleryClose: () => {
            this.closeGallery();
          },
          onKeyboardEvent: (event) => {
            if (event.key === "Escape" && gallerySignals.isOpen.value) {
              this.closeGallery();
            }
          },
        },
        {
          enableKeyboard,
          enableMediaDetection: true,
          debugMode: false,
          preventBubbling: true,
          context: "gallery",
        },
      );

      logger.info("[GalleryApp] ✅ Event handlers setup complete");
    } catch (error) {
      logger.error("[GalleryApp] ❌ Event handlers setup failed:", error);
      throw error;
    }
  }

  /**
   * Handle media click event
   */
  private async handleMediaClick(
    _mediaInfo: unknown,
    element: HTMLElement,
  ): Promise<void> {
    try {
      const mediaService = getMediaServiceFromContainer();

      if (!(mediaService instanceof MediaService)) {
        throw new Error("MediaService not available from container");
      }

      const result = await mediaService.extractFromClickedElement(element);

      if (result.success && result.mediaItems.length > 0) {
        await this.openGallery(result.mediaItems, result.clickedIndex);
      } else {
        logger.warn("[GalleryApp] Media extraction failed:", {
          success: result.success,
          mediaCount: result.mediaItems.length,
        });
        void this.notificationService.error(
          "Failed to load media",
          "Could not find images or videos.",
        );
      }
    } catch (error) {
      logger.error("[GalleryApp] Error during media extraction:", error);
      void this.notificationService.error(
        "Error occurred",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  /**
   * Open gallery
   */
  public async openGallery(
    mediaItems: MediaInfo[],
    startIndex: number = 0,
  ): Promise<void> {
    if (!this.isInitialized) {
      logger.warn(
        "[GalleryApp] Gallery not initialized. Tampermonkey may not be installed.",
      );
      void this.notificationService.error(
        "Gallery unavailable",
        "Tampermonkey or similar userscript manager is required.",
      );
      return;
    }

    if (!mediaItems?.length) {
      logger.warn("Failed to open gallery: no media items");
      return;
    }

    try {
      const validIndex = Math.max(
        0,
        Math.min(startIndex, mediaItems.length - 1),
      );
      logger.info("[GalleryApp] Opening gallery:", {
        mediaCount: mediaItems.length,
        startIndex: validIndex,
      });

      try {
        pauseActiveTwitterVideos();
      } catch (error) {
        logger.warn(
          "[GalleryApp] Ambient video pause failed (non-blocking)",
          error,
        );
      }

      // Update state (renderer auto-renders via signal subscription)
      openGallery(mediaItems, validIndex);
    } catch (error) {
      logger.error("[GalleryApp] Failed to open gallery:", error);
      void this.notificationService.error(
        "Failed to load gallery",
        error instanceof Error ? error.message : "Unknown error",
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
      logger.debug("[GalleryApp] Gallery closed");
    } catch (error) {
      logger.error("[GalleryApp] Failed to close gallery:", error);
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
      logger.info("[GalleryApp] Cleanup started");

      if (gallerySignals.isOpen.value) {
        this.closeGallery();
      }

      try {
        const { cleanupGalleryEvents } = await import(
          "@shared/utils/events/lifecycle/gallery-lifecycle"
        );
        cleanupGalleryEvents();
      } catch (error) {
        logger.warn("[GalleryApp] Event cleanup failed:", error);
      }

      this.galleryRenderer = null;
      this.isInitialized = false;

      delete (globalThis as { xegGalleryDebug?: unknown }).xegGalleryDebug;
      logger.info("[GalleryApp] ✅ Cleanup complete");
    } catch (error) {
      logger.error("[GalleryApp] ❌ Error during cleanup:", error);
    }
  }
}
