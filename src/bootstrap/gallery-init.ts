/**
 * @fileoverview Gallery bootstrap helpers.
 *
 * Separates gallery-adjacent service preparation from gallery app creation so
 * startup ordering stays deterministic.
 *
 * @module bootstrap/gallery-init
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { GalleryApp } from '@features/gallery/GalleryApp';
import { GalleryRenderer } from '@features/gallery/GalleryRenderer.tsx';
import { SettingsService } from '@features/settings/services/settings-service';
import type { IGalleryApp } from '@shared/container/app-container';
import {
  registerGalleryRenderer,
  registerSettingsManager,
  tryGetSettingsManager,
} from '@shared/container/service-accessors';
import {
  bootstrapErrorReporter,
  galleryErrorReporter,
  settingsErrorReporter,
} from '@shared/error/app-error-reporter';
import { getUserscriptSafe } from '@shared/external/userscript/adapter';
import { isGMAPIAvailable } from '@shared/external/userscript/environment-detector';
import { logger } from '@shared/logging/logger';
import { CoreService } from '@shared/services/service-manager';

type InitializableSettingsService = {
  initialize?: () => Promise<void>;
  isInitialized?: () => boolean;
};

// Cache GM API availability (does not change during a session)
const hasRequiredGMAPIs = isGMAPIAvailable('download') || isGMAPIAvailable('setValue');

function ensureRendererRegistered(): void {
  if (CoreService.getInstance().has(SERVICE_KEYS.GALLERY_RENDERER)) {
    return;
  }

  registerGalleryRenderer(new GalleryRenderer());
}

async function initializeSettingsService(): Promise<void> {
  const existingSettings = tryGetSettingsManager<InitializableSettingsService>();
  if (existingSettings) {
    if (existingSettings.isInitialized?.() === false && existingSettings.initialize) {
      await existingSettings.initialize();
    }
    return;
  }

  const service = new SettingsService();
  await service.initialize();
  registerSettingsManager(service);
}

/**
 * Initialize settings and other gallery-adjacent services before gallery startup.
 *
 * Settings remain non-fatal: startup continues with defaults if they cannot load.
 */
export async function initializeGalleryServices(): Promise<void> {
  if (!hasRequiredGMAPIs) {
    bootstrapErrorReporter.warn(new Error('Tampermonkey APIs limited'), {
      code: 'GM_API_LIMITED',
    });
  }

  try {
    await initializeSettingsService();
    if (__DEV__) {
      logger.debug('[Bootstrap] ✅ SettingsService initialized');
    }
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
    getUserscriptSafe().notification({
      title: 'Settings unavailable',
      text: 'Defaults will be used until settings load.',
    });
  }
}

/**
 * Initialize and return the gallery application instance.
 *
 * Ensures the renderer is registered, then creates and initializes the GalleryApp.
 *
 * @returns Initialized IGalleryApp instance
 * @throws If gallery app creation or initialization fails
 */
export async function initializeGalleryApp(): Promise<IGalleryApp> {
  try {
    if (__DEV__) {
      logger.info('🎨 Gallery app lazy initialization starting');
    }

    ensureRendererRegistered();

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
