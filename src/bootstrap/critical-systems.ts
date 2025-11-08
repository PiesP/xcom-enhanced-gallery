/**
 * @fileoverview Critical Systems Initialization
 * @description Phase 2.1: Critical Path initialization logic
 * Core systems initialization separated in Phase A5.2
 * Phase 343: Standardized error handling
 */

import { logger } from '../shared/logging';
import { warmupCriticalServices } from '../shared/container/service-accessors';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Critical Path - Essential system initialization (synchronous part only)
 *
 * Responsibilities:
 * - Register core services (dynamic import)
 * - Immediately initialize critical services
 * - Force load factories/services
 *
 * Phase 343: Critical system - app startup impossible on error
 *
 * @throws {Error} On critical initialization failure (app startup impossible)
 */
export async function initializeCriticalSystems(): Promise<void> {
  try {
    logger.info('Critical Path initialization starting');

    // Register core services (dynamic import)
    const { registerCoreServices } = await import('../shared/services/core-services');
    await registerCoreServices();

    // Immediately initialize only critical services
    // Force load (activate factories/services immediately)
    warmupCriticalServices();

    logger.info('✅ Critical Path initialization complete');
  } catch (error) {
    // Phase 343: Standardized error handling
    handleBootstrapError(
      error,
      { ...CRITICAL_ERROR_STRATEGY, context: 'critical-systems' },
      logger
    );
  }
}
