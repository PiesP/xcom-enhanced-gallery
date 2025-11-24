/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 */

import { logger } from "@shared/logging";
import {
  CORE_BASE_SERVICE_IDENTIFIERS,
  LANGUAGE_SERVICE_IDENTIFIER,
  THEME_SERVICE_IDENTIFIER,
  type CoreBaseServiceIdentifier,
} from "@shared/container/service-accessors";
import { CoreService } from "@shared/services/core-service-manager";
import { languageService } from "@shared/services/language-service";
import { themeService } from "@shared/services/theme-service";
import { reportBootstrapError } from "@/bootstrap/types";
import type { BaseService } from "@shared/types/core/base-service.types";

type BaseServiceRegistration = readonly [
  CoreBaseServiceIdentifier,
  BaseService,
];

const BASE_SERVICE_REGISTRATIONS: ReadonlyArray<BaseServiceRegistration> = [
  [THEME_SERVICE_IDENTIFIER, themeService],
  [LANGUAGE_SERVICE_IDENTIFIER, languageService],
];

function registerMissingBaseServices(coreService: CoreService): number {
  let registeredCount = 0;

  for (const [key, service] of BASE_SERVICE_REGISTRATIONS) {
    if (!coreService.tryGetBaseService(key)) {
      coreService.registerBaseService(key, service);
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
      logger.debug(
        `[base-services] Registered ${newlyRegistered} base services`,
      );
    }

    await coreService.initializeAllBaseServices([
      ...CORE_BASE_SERVICE_IDENTIFIERS,
    ]);
    if (import.meta.env.DEV) {
      logger.debug("[base-services] Base services ready");
    }
  } catch (error) {
    reportBootstrapError(error, { context: "base-services", logger });
  }
}
