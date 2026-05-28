// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

// Re-export settings registry
export {
  getSettings,
  getTypedSettingOr,
  registerSettings,
  setTypedSetting,
  tryGetSettings,
} from '@shared/container/settings-registry';

/**
 * Get the singleton ThemeService instance.
 *
 * @returns The ThemeService singleton
 */
export function getThemeService(): ThemeService {
  return ThemeService.getInstance();
}

/**
 * Get the singleton LanguageService instance.
 *
 * @returns The LanguageService singleton
 */
export function getLanguageService(): LanguageService {
  return LanguageService.getInstance();
}

/**
 * Get the singleton MediaService instance.
 *
 * @returns The MediaService singleton
 */
export function getMediaService(): MediaService {
  return MediaService.getInstance();
}

/**
 * Get the singleton DownloadOrchestrator instance.
 *
 * @returns The DownloadOrchestrator singleton
 */
export function getDownloadOrchestrator(): DownloadOrchestrator {
  return DownloadOrchestrator.getInstance();
}
