/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: Gallery app creation and initialization
 * Lazy loading and lifecycle management
 * Phase 345: Enhanced type safety
 */

import { registerGalleryRenderer, registerSettingsManager } from '@shared/container';
import type { IGalleryApp } from '@shared/container/app-container';
import { isGMAPIAvailable } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type { SettingsServiceLike } from '@shared/services/theme-service';

let rendererRegistrationTask: Promise<void> | null = null;

async function registerRenderer(): Promise<void> {
  if (!rendererRegistrationTask) {
    rendererRegistrationTask = (async () => {
      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer');
      registerGalleryRenderer(new GalleryRenderer());
    })().finally(() => {
      rendererRegistrationTask = null;
    });
  }

  await rendererRegistrationTask;
}

/**
 * Initialize core services required for the gallery
 */
async function initializeServices(): Promise<void> {
  // 1. Environment Check
  const hasRequiredGMAPIs = isGMAPIAvailable('download') || isGMAPIAvailable('setValue');
  if (!hasRequiredGMAPIs) {
    logger.warn('[Bootstrap] Tampermonkey APIs limited - some features may be unavailable');
  }

  // 2. Settings Service
  let settingsService: SettingsServiceLike | null = null;
  try {
    const { SettingsService } = await import('@features/settings/services/settings-service');
    const service = new SettingsService();
    await service.initialize();
    registerSettingsManager(service);
    settingsService = service as unknown as SettingsServiceLike;
    logger.debug('[Bootstrap] ✅ SettingsService initialized');
  } catch (error) {
    logger.warn('[Bootstrap] SettingsService initialization failed:', error);
  }

  // 3. Theme Service
  try {
    const { getThemeService } = await import('@shared/container/service-accessors');
    const themeService = getThemeService();

    if (!themeService.isInitialized()) {
      await themeService.initialize();
    }

    if (settingsService) {
      themeService.bindSettingsService(settingsService as unknown as SettingsServiceLike);
      // Apply stored theme immediately
      const storedTheme = themeService.getCurrentTheme();
      themeService.setTheme(storedTheme, { force: true, persist: false });
    }

    logger.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
  } catch (error) {
    logger.warn('[Bootstrap] Theme check/sync failed:', error);
  }
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
    logger.info('🎨 Gallery app lazy initialization starting');

    // Parallel initialization of renderer and services
    await Promise.all([registerRenderer(), initializeServices()]);

    const { GalleryApp } = await import('@features/gallery/GalleryApp');
    const galleryApp = new GalleryApp();
    await galleryApp.initialize();

    logger.info('✅ Gallery app initialization complete');
    return galleryApp;
  } catch (error) {
    logger.error('❌ Gallery app initialization failed:', error);
    throw error;
  }
}
