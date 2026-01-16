/**
 * @fileoverview Gallery app lazy initialization with service setup.
 *
 * Orchestrates renderer, settings, and theme service initialization.
 * Parallel initialization for performance; graceful degradation on non-critical failures.
 *
 * @module bootstrap/gallery-init
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
import { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
import { logger } from '@shared/logging/logger';
import { NotificationService } from '@shared/services/notification-service';
import type { SettingsServiceLike } from '@shared/services/theme-service';

/** @internal Singleton guard for renderer registration */
let rendererRegistrationTask: Promise<void> | null = null;

/** @internal Register GalleryRenderer with singleton pattern */
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

/** @internal Initialize SettingsService and ThemeService with graceful degradation */
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
    if (__DEV__) {
      logger.debug('[Bootstrap] ✅ SettingsService initialized');
    }
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
    try {
      await NotificationService.getInstance().error(
        'Settings unavailable',
        'Defaults will be used until settings load.'
      );
    } catch (notifyError) {
      if (__DEV__) {
        logger.debug('[Bootstrap] Settings fallback notice failed', notifyError);
      }
    }
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

    if (__DEV__) {
      logger.debug(`[Bootstrap] Theme confirmed: ${themeService.getCurrentTheme()}`);
    }
  } catch (error) {
    bootstrapErrorReporter.warn(error, {
      code: 'THEME_SYNC_FAILED',
    });
  }
}

/**
 * Initialize and return the gallery application instance.
 *
 * Sets up renderer, settings, and theme services in parallel, then creates and initializes
 * the GalleryApp. Non-critical service failures are logged but don't block initialization;
 * fatal errors are caught, logged, and re-thrown.
 *
 * @returns Initialized IGalleryApp instance
 * @throws If gallery app creation or initialization fails
 */
export async function initializeGalleryApp(): Promise<IGalleryApp> {
  try {
    if (__DEV__) {
      logger.info('🎨 Gallery app lazy initialization starting');
    }

    // Parallel initialization of renderer and services
    await Promise.all([registerRenderer(), initializeServices()]);

    const galleryApp = new GalleryApp();
    await galleryApp.initialize();

    if (__DEV__) {
      logger.info('✅ Gallery app initialization complete');
    }
    return galleryApp;
  } catch (error) {
    galleryErrorReporter.error(error, {
      code: 'GALLERY_APP_INIT_FAILED',
    });
    throw error;
  }
}
