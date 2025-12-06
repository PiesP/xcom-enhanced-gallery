/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 * Refactor: ES Module singleton pattern integration
 */

import { reportBootstrapError } from '@bootstrap/types';
import {
  CORE_BASE_SERVICE_IDENTIFIERS,
  type CoreBaseServiceIdentifier,
  LANGUAGE_SERVICE_IDENTIFIER,
  MEDIA_SERVICE_IDENTIFIER,
  THEME_SERVICE_IDENTIFIER,
} from '@shared/container/service-accessors';
import { logger } from '@shared/logging';
import { CoreService } from '@shared/services/service-manager';
import {
  getLanguageServiceInstance,
  getMediaServiceInstance,
  getThemeServiceInstance,
} from '@shared/services/singletons';
import type { BaseService } from '@shared/types/core/base-service.types';

type BaseServiceRegistration = readonly [CoreBaseServiceIdentifier, () => BaseService];

/**
 * Service registrations using singleton getter functions.
 * This ensures consistent instances across the application.
 */
const BASE_SERVICE_REGISTRATIONS: ReadonlyArray<BaseServiceRegistration> = [
  [THEME_SERVICE_IDENTIFIER, getThemeServiceInstance],
  [LANGUAGE_SERVICE_IDENTIFIER, getLanguageServiceInstance],
  [MEDIA_SERVICE_IDENTIFIER, getMediaServiceInstance],
];

function registerMissingBaseServices(coreService: CoreService): number {
  let registeredCount = 0;

  for (const [key, getService] of BASE_SERVICE_REGISTRATIONS) {
    if (!coreService.has(key)) {
      coreService.register(key, getService());
      registeredCount += 1;
    }
  }

  return registeredCount;
}

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
 * @note On failure, only warning is printed and app continues (non-critical)
 */
export async function initializeCoreBaseServices(): Promise<void> {
  const coreService = CoreService.getInstance();

  try {
    const newlyRegistered = registerMissingBaseServices(coreService);
    if (newlyRegistered > 0 && __DEV__) {
      logger.debug(`[base-services] Registered ${newlyRegistered} base services`);
    }

    // Initialize services manually
    for (const identifier of CORE_BASE_SERVICE_IDENTIFIERS) {
      const service = coreService.get<BaseService>(identifier);
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
      }
    }

    if (__DEV__) {
      logger.debug('[base-services] Base services ready');
    }
  } catch (error) {
    reportBootstrapError(error, { context: 'base-services', logger });
  }
}
