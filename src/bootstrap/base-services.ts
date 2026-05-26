// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Core base services initialization for application bootstrap.
 *
 * Invokes lifecycle `initialize()` on ES module singletons (theme, language, media).
 */

import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

export async function initializeCoreBaseServices(): Promise<void> {
  const services = [
    ThemeService.getInstance(),
    LanguageService.getInstance(),
    MediaService.getInstance(),
  ] as const;
  for (const service of services) {
    await service.initialize();
  }
}
