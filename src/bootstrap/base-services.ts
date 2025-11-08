/**
 * @fileoverview Base Services Initialization
 * @description Phase 2.1: Centralize BaseService lifecycle
 * Base services initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 */

import { logger } from '../shared/logging';
import {
  registerCoreBaseServices,
  initializeBaseServices,
} from '../shared/container/service-accessors';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

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
  try {
    logger.debug('🔄 Registering BaseService registry...');
    registerCoreBaseServices();

    logger.debug('🔄 Initializing BaseService...');
    await initializeBaseServices();

    logger.debug('✅ BaseService initialization complete');
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    handleBootstrapError(
      error,
      { ...NON_CRITICAL_ERROR_STRATEGY, context: 'base-services' },
      logger
    );
  }
}
