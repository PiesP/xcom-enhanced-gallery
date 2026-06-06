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

export const getThemeService = (): ThemeService => ThemeService.getInstance();
export const getLanguageService = (): LanguageService => LanguageService.getInstance();
export const getMediaService = (): MediaService => MediaService.getInstance();
export const getDownloadOrchestrator = (): DownloadOrchestrator =>
  DownloadOrchestrator.getInstance();

export { getEventManager } from '@shared/container/event-manager-accessor';
