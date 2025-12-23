/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 * Refactor: ES Module singleton pattern integration
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { logger } from '@shared/logging';
import { CoreService } from '@shared/services/service-manager';
import {
  getLanguageServiceInstance,
  getMediaServiceInstance,
  getThemeServiceInstance,
} from '@shared/services/singletons';
import type { BaseService } from '@shared/types/core/base-service.types';

/** Core base service identifiers for initialization */
const CORE_BASE_SERVICE_IDENTIFIERS = [
  SERVICE_KEYS.THEME,
  SERVICE_KEYS.LANGUAGE,
  SERVICE_KEYS.MEDIA_SERVICE,
] as const;

type CoreBaseServiceIdentifier = (typeof CORE_BASE_SERVICE_IDENTIFIERS)[number];
type BaseServiceRegistration = readonly [CoreBaseServiceIdentifier, () => BaseService];

/**
 * Service registrations using singleton getter functions.
 * This ensures consistent instances across the application.
 */
const BASE_SERVICE_REGISTRATIONS: ReadonlyArray<BaseServiceRegistration> = [
  [SERVICE_KEYS.THEME, getThemeServiceInstance],
  [SERVICE_KEYS.LANGUAGE, getLanguageServiceInstance],
  [SERVICE_KEYS.MEDIA_SERVICE, getMediaServiceInstance],
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
 * @note Errors are intentionally propagated so the bootstrap runner can record failures.
 *       Whether the app continues depends on the stage optionality.
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
    throw new Error('[base-services] initialization failed', {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
