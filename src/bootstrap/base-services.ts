/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 * Refactor: ES Module singleton pattern integration
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { logger } from '@shared/logging';
import { registerCoreServices } from '@shared/services/service-initialization';
import { CoreService } from '@shared/services/service-manager';
import type { BaseService } from '@shared/types/core/base-service.types';

/**
 * Phase A5.2: Centralized BaseService lifecycle initialization
 *
 * Responsibilities:
 * - Register and initialize ThemeService
 * - Register and initialize LanguageService
 * - Central management from service-manager
 * - Phase 414: AnimationService removed (optional feature)
 *
 * Phase 343: Non-Critical system - on failure, warn only and continue app
 *
 * @note Errors are intentionally propagated so the bootstrap runner can record failures.
 *       Whether the app continues depends on the stage optionality.
 */
export async function initializeCoreBaseServices(): Promise<void> {
  const coreService = CoreService.getInstance();

  try {
    // Some environments (e.g., component tests) call this initializer directly
    // without running the full bootstrap chain. Ensure required services exist.
    registerCoreServices();

    const theme = coreService.get<BaseService>(SERVICE_KEYS.THEME);
    if (theme && typeof theme.initialize === 'function') {
      await theme.initialize();
    }

    const language = coreService.get<BaseService>(SERVICE_KEYS.LANGUAGE);
    if (language && typeof language.initialize === 'function') {
      await language.initialize();
    }

    const media = coreService.get<BaseService>(SERVICE_KEYS.MEDIA_SERVICE);
    if (media && typeof media.initialize === 'function') {
      await media.initialize();
    }

    if (__DEV__) {
      logger.debug('[base-services] Base services ready');
    }
  } catch (error) {
    throw new Error('[base-services] initialization failed', {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
