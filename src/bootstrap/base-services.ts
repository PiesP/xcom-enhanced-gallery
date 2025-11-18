/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 */

import { logger } from '@shared/logging';
import {
  CORE_BASE_SERVICE_IDENTIFIERS,
  LANGUAGE_SERVICE_IDENTIFIER,
  THEME_SERVICE_IDENTIFIER,
} from '@shared/container/service-accessors';
import { CoreService } from '@shared/services/core';
import { languageService } from '@shared/services/language-service';
import { themeService } from '@shared/services/theme-service';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from '@/bootstrap/types';

const BASE_SERVICE_IDS = CORE_BASE_SERVICE_IDENTIFIERS;
const BASE_SERVICE_REGISTRATIONS = [
  [THEME_SERVICE_IDENTIFIER, themeService],
  [LANGUAGE_SERVICE_IDENTIFIER, languageService],
] as const;

function ensureBaseServicesRegistered(coreService: CoreService): void {
  for (const [key, service] of BASE_SERVICE_REGISTRATIONS) {
    const existing = coreService.tryGetBaseService(key);
    if (!existing) {
      coreService.registerBaseService(key, service);
    }
  }
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
    ensureBaseServicesRegistered(coreService);
    await coreService.initializeAllBaseServices([...BASE_SERVICE_IDS]);
    logger.debug('[base-services] Base services ready');
  } catch (error) {
    handleBootstrapError(
      error,
      { ...NON_CRITICAL_ERROR_STRATEGY, context: 'base-services' },
      logger
    );
  }
}
