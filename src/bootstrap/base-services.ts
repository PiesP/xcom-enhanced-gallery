/**
 * @fileoverview Core base services initialization for application bootstrap.
 *
 * Invokes lifecycle `initialize()` on ES module singletons (theme, language, media).
 */

import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

export async function initializeCoreBaseServices(): Promise<void> {
  try {
    const services = [
      ThemeService.getInstance(),
      LanguageService.getInstance(),
      MediaService.getInstance(),
    ];
    for (const service of services) {
      if (service?.initialize) {
        await service.initialize();
      }
    }
  } catch (error) {
    throw new Error('[base-services] initialization failed', {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
