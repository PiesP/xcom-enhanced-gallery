// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery bootstrap helpers.
 */

import { GalleryApp } from '@features/gallery/gallery-app';
import { GalleryRenderer } from '@features/gallery/gallery-renderer';
import { getSettingsService } from '@features/settings/services/settings-service';
import { getNotificationAdapter } from '@platform/index';
import { registerSettings } from '@shared/container/settings-registry';
import { galleryErrorReporter, settingsErrorReporter } from '@shared/error/app-error-reporter';
import { logger } from '@shared/logging/logger';
import { getLanguageService } from '@shared/services/language-service';
import { getMediaService } from '@shared/services/media-service';
import { getThemeService } from '@shared/services/theme-service';

export async function initializeCoreBaseServices(): Promise<void> {
  const services = [getThemeService(), getLanguageService(), getMediaService()] as const;
  await Promise.all(services.map((s) => s.initialize()));
}

async function initializeSettingsService(): Promise<void> {
  const settings = getSettingsService();
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
    const lang = getLanguageService();
    getNotificationAdapter().notify(
      lang.translate('msg.err.settingsUnavailable.title'),
      lang.translate('msg.err.settingsUnavailable.body')
    );
  }
}

export async function initializeGalleryApp(): Promise<GalleryApp> {
  try {
    if (__DEV__) {
      logger.info('Gallery app lazy initialization starting');
    }

    const renderer = new GalleryRenderer();

    const galleryApp = new GalleryApp(renderer);
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
