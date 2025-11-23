/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: Gallery app creation and initialization
 * Lazy loading and lifecycle management
 * Phase 345: Enhanced type safety
 */

import { logger } from "@shared/logging";
import { registerGalleryRenderer } from "@shared/container";
import type { IGalleryApp } from "@shared/container/app-container";

let rendererRegistrationTask: Promise<void> | null = null;

async function registerRenderer(): Promise<void> {
  if (!rendererRegistrationTask) {
    rendererRegistrationTask = (async () => {
      const { GalleryRenderer } = await import(
        "@features/gallery/GalleryRenderer"
      );
      registerGalleryRenderer(new GalleryRenderer());
    })().finally(() => {
      rendererRegistrationTask = null;
    });
  }

  await rendererRegistrationTask;
}

/**
 * Gallery app creation and initialization (lazy loading)
 *
 * Responsibilities:
 * - Register GalleryRenderer service
 * - Create GalleryApp instance
 * - Perform gallery initialization
 * - Provide global access in development environment
 *
 * @returns Initialized gallery app instance
 * @throws {Error} On gallery initialization failure
 */
export async function initializeGalleryApp(): Promise<IGalleryApp> {
  try {
    logger.info("🎨 Gallery app lazy initialization starting");

    await registerRenderer();

    const { GalleryApp } = await import("@features/gallery/GalleryApp");
    const galleryApp = new GalleryApp();
    await galleryApp.initialize();

    logger.info("✅ Gallery app initialization complete");
    return galleryApp;
  } catch (error) {
    logger.error("❌ Gallery app initialization failed:", error);
    throw error;
  }
}
