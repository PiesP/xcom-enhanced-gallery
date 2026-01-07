/**
 * @fileoverview Core base services initialization for application bootstrap.
 *
 * Initializes and registers essential services (theme, language, media) required
 * for application functionality. Part of the bootstrap stage pipeline, executed
 * after critical systems initialization but before gallery initialization.
 *
 * Services initialized:
 * - ThemeService: UI theme management and dark/light mode
 * - LanguageService: i18n and translation support
 * - MediaService: Media detection and API integration
 *
 * Historical notes:
 * - Phase A5.2: Centralized BaseService lifecycle management
 * - Phase 343: Standardized error handling and non-critical classification
 * - Phase 414: AnimationService removed (optional feature)
 * - Refactor: ES Module singleton pattern integration
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { logger } from '@shared/logging/logger';
import { registerCoreServices } from '@shared/services/service-initialization';
import { CoreService } from '@shared/services/service-manager';
import type { BaseService } from '@shared/types/core/base-service.types';

/**
 * Initialize core base services (theme, language, media).
 *
 * Registers core services via service-initialization module and initializes
 * each service sequentially. Safe to call in isolated environments (e.g., tests)
 * as it ensures services are registered before initialization.
 *
 * Lifecycle:
 * 1. Register services (theme, language, media) via registerCoreServices()
 * 2. Initialize ThemeService if available
 * 3. Initialize LanguageService if available
 * 4. Initialize MediaService if available
 *
 * Errors are propagated to allow bootstrap stage runner to handle failures
 * according to stage optionality configuration.
 *
 * @returns Promise resolving when all base services are initialized
 * @throws Error with cause chain if any service initialization fails
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
