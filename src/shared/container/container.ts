// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

export { getEventManager, resetEventManager } from '@shared/container/event-manager-accessor';

/** Get the singleton ThemeService instance */
export const getThemeService = (): ThemeService => ThemeService.getInstance();
/** Get the singleton LanguageService instance */
export const getLanguageService = (): LanguageService => LanguageService.getInstance();
/** Get the singleton MediaService instance */
export const getMediaService = (): MediaService => MediaService.getInstance();
/** Get the singleton DownloadOrchestrator instance */
export const getDownloadOrchestrator = (): DownloadOrchestrator =>
  DownloadOrchestrator.getInstance();
