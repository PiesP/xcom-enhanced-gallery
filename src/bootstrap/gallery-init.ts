/**
 * @fileoverview Gallery App Initialization
 * @description Phase 2.1: Gallery app creation and initialization
 * Lazy loading and lifecycle management
 * Phase 345: Enhanced type safety
 */

import { GalleryApp } from '@features/gallery/GalleryApp';
import { GalleryRenderer } from '@features/gallery/GalleryRenderer.tsx';
import { SettingsService } from '@features/settings/services/settings-service';
import type { IGalleryApp } from '@shared/container/app-container';
import {
  getThemeService,
  registerGalleryRenderer,
  registerSettingsManager,
} from '@shared/container/service-accessors';
import {
  bootstrapErrorReporter,
  galleryErrorReporter,
  settingsErrorReporter,
} from '@shared/error/app-error-reporter';
import { isGMAPIAvailable } from '@shared/external/userscript';
import { logger } from '@shared/logging';
import type { SettingsServiceLike } from '@shared/services/theme-service';

let rendererRegistrationTask: Promise<void> | null = null;

async function registerRenderer(): Promise<void> {
  if (!rendererRegistrationTask) {
    rendererRegistrationTask = (async () => {
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
    const service = new SettingsService();
    await service.initialize();
    registerSettingsManager(service);
    settingsService = service as unknown as SettingsServiceLike;
    logger.debug('[Bootstrap] ✅ SettingsService initialized');
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
  }

  // 3. Theme Service
  try {
    const themeService = getThemeService();

    if (!themeService.isInitialized()) {
      await themeService.initialize();
    }

    if (settingsService) {
      themeService.bindSettingsService(settingsService);
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
