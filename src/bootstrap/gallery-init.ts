/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: Gallery app creation and initialization
 * Lazy loading and lifecycle management
 * Phase 345: Enhanced type safety
 */

import { logger } from '../shared/logging';
import { registerGalleryRenderer } from '../shared/container/service-accessors';
import type { IGalleryApp } from '../shared/container/app-container';

/** Gallery app instance (module-level management) */
let galleryAppInstance: IGalleryApp | null = null;

/**
 * Gallery app instance accessor
 */
export function getGalleryApp(): IGalleryApp | null {
  return galleryAppInstance;
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
  if (galleryAppInstance) {
    logger.debug('Gallery app already initialized');
    return galleryAppInstance;
  }

  try {
    logger.info('🎨 Gallery app lazy initialization starting');

    // Register Gallery Renderer service (needed only for gallery app)
    const { GalleryRenderer } = await import('../features/gallery/GalleryRenderer');
    registerGalleryRenderer(new GalleryRenderer());

    // Create gallery app instance
    const { GalleryApp } = await import('../features/gallery/GalleryApp');
    galleryAppInstance = new GalleryApp();

    // Initialize gallery app
    if (!galleryAppInstance) {
      throw new Error('GalleryApp creation failed');
    }
    await galleryAppInstance.initialize();
    logger.info('✅ Gallery app initialization complete');

    return galleryAppInstance as IGalleryApp;
  } catch (error) {
    logger.error('❌ Gallery app initialization failed:', error);
    throw error;
  }
}

/**
 * Gallery app cleanup
 *
 * @note Called from cleanup() function
 */
export function clearGalleryApp(): void {
  galleryAppInstance = null;
}
