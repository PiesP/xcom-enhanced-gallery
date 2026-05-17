/**
 * @fileoverview Gallery bootstrap helpers.
 */

import { GalleryApp } from '@features/gallery/GalleryApp';
import { GalleryRenderer } from '@features/gallery/GalleryRenderer.tsx';
import { SettingsService } from '@features/settings/services/settings-service';
import { registerSettings } from '@shared/container/container';
import { galleryErrorReporter, settingsErrorReporter } from '@shared/error/app-error-reporter';
import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';

async function initializeSettingsService(): Promise<void> {
  const settings = new SettingsService();
  await settings.initialize();
  registerSettings(settings);
}

export async function initializeGalleryServices(): Promise<void> {
  try {
    await initializeSettingsService();
    if (__DEV__) {
      logger.debug('[Bootstrap] SettingsService initialized');
    }
  } catch (error) {
    settingsErrorReporter.warn(error, {
      code: 'SETTINGS_SERVICE_INIT_FAILED',
    });
    getUserscript().notification({
      title: 'Settings unavailable',
      text: 'Defaults will be used until settings load.',
    });
  }
}

export async function initializeGalleryApp(): Promise<GalleryApp> {
  try {
    if (__DEV__) {
      logger.info('Gallery app lazy initialization starting');
    }

    new GalleryRenderer();

    const galleryApp = new GalleryApp();
    await galleryApp.initialize();

    if (__DEV__) {
      logger.info('Gallery app initialization complete');
    }
    return galleryApp;
  } catch (error) {
    galleryErrorReporter.error(error, {
      code: 'GALLERY_APP_INIT_FAILED',
    });
    throw error;
  }
}
