/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 */

import { reportBootstrapError } from '@/bootstrap/types';
import {
  CORE_BASE_SERVICE_IDENTIFIERS,
  LANGUAGE_SERVICE_IDENTIFIER,
  MEDIA_SERVICE_IDENTIFIER,
  THEME_SERVICE_IDENTIFIER,
  type CoreBaseServiceIdentifier,
} from '@shared/container/service-accessors';
import { logger } from '@shared/logging';
import { CoreService } from '@shared/services/core-service-manager';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';
import type { BaseService } from '@shared/types/core/base-service.types';

type BaseServiceRegistration = readonly [CoreBaseServiceIdentifier, BaseService];

const BASE_SERVICE_REGISTRATIONS: ReadonlyArray<BaseServiceRegistration> = [
  [THEME_SERVICE_IDENTIFIER, ThemeService.getInstance()],
  [LANGUAGE_SERVICE_IDENTIFIER, LanguageService.getInstance()],
  [MEDIA_SERVICE_IDENTIFIER, MediaService.getInstance()],
];

function registerMissingBaseServices(coreService: CoreService): number {
  let registeredCount = 0;

  for (const [key, service] of BASE_SERVICE_REGISTRATIONS) {
    if (!coreService.has(key)) {
      coreService.register(key, service);
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
    if (newlyRegistered > 0 && import.meta.env.DEV) {
      logger.debug(`[base-services] Registered ${newlyRegistered} base services`);
    }

    // Initialize services manually
    for (const identifier of CORE_BASE_SERVICE_IDENTIFIERS) {
      const service = coreService.get<BaseService>(identifier);
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
      }
    }

    if (import.meta.env.DEV) {
      logger.debug('[base-services] Base services ready');
    }
  } catch (error) {
    reportBootstrapError(error, { context: 'base-services', logger });
  }
}
