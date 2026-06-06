// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Gallery bootstrap helpers.
 */

import { GalleryApp } from '@features/gallery/GalleryApp';
import { GalleryRenderer } from '@features/gallery/GalleryRenderer';
import { SettingsService } from '@features/settings/services/settings-service';
import { registerSettings } from '@shared/container/container';
import { galleryErrorReporter, settingsErrorReporter } from '@shared/error/app-error-reporter';
import { getUserscript } from '@shared/external/userscript/adapter';
import { logger } from '@shared/logging/logger';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

export async function initializeCoreBaseServices(): Promise<void> {
  const services = [
    ThemeService.getInstance(),
    LanguageService.getInstance(),
    MediaService.getInstance(),
  ] as const;
  await Promise.all(services.map((s) => s.initialize()));
}

async function initializeSettingsService(): Promise<void> {
  const settings = SettingsService.getInstance();
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
