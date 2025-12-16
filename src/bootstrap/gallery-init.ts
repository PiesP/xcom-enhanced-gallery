/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: Gallery app creation and initialization
 * Lazy loading and lifecycle management
 * Phase 345: Enhanced type safety
 */

import { registerGalleryRenderer, registerSettingsManager } from '@shared/container';
import type { IGalleryApp } from '@shared/container/app-container';
import { bootstrapErrorReporter, galleryErrorReporter, settingsErrorReporter } from '@shared/error';
import { isGMAPIAvailable } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type { SettingsServiceLike } from '@shared/services/theme-service';
import { isSettingsServiceLike } from '@shared/utils/types/guards';

let rendererRegistrationTask: Promise<void> | null = null;

async function registerRenderer(): Promise<void> {
  if (!rendererRegistrationTask) {
    rendererRegistrationTask = (async () => {
      const { GalleryRenderer } = await import('@features/gallery/GalleryRenderer.tsx');
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
    bootstrapErrorReporter.warn(new Error('Tampermonkey APIs limited'), {
      code: 'GM_API_LIMITED',
    });
  }

  // 2. Settings Service
  let settingsService: SettingsServiceLike | null = null;
  try {
    const { SettingsService } = await import('@features/settings/services/settings-service');
    const service = new SettingsService();
    await service.initialize();
    registerSettingsManager(service);
    // Runtime validation before type assertion for safer binding
    if (isSettingsServiceLike(service)) {
      // SettingsService implements a superset of SettingsServiceLike
      // Type assertion is safe after runtime validation
      settingsService = service as SettingsServiceLike;
    }
    logger.debug('[Bootstrap] ✅ SettingsService initialized');
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
  }

  // 3. Theme Service
  try {
    const { getThemeService } = await import('@shared/container/service-accessors');
    const themeService = getThemeService();

    if (!themeService.isInitialized()) {
      await themeService.initialize();
    }

    if (settingsService) {
      themeService.bindSettingsService(settingsService);
      // Apply stored theme immediately
      const storedTheme = themeService.getCurrentTheme();
      themeService.setTheme(storedTheme, { force: true, persist: false });
    }

    logger.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'THEME_SYNC_FAILED',
    });
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
    galleryErrorReporter.error(error, {
      code: 'GALLERY_APP_INIT_FAILED',
    });
    throw error;
  }
}
