/**
 * @fileoverview Runtime Environment Initialization - Phase 314-5
 * @description Vendor library and runtime environment initialization, service availability check
 * @module bootstrap/environment
 */

import { logger } from '../shared/logging';
import { getBootstrapDiagnostics, type BootstrapResult } from './diagnostics';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Runtime environment initialization (Phase 314-5, Phase 343 improvements)
 * - Initialize vendor libraries (Solid.js, Solid Store, etc.)
 * - Check service availability
 * - Return bootstrap diagnostics information
 *
 * Phase 343: Standardized error handling (Critical system)
 *
 * @throws {Error} On vendor initialization failure (Critical error)
 * @returns {Promise<BootstrapResult>} Bootstrap result and diagnostic information
 */
export async function initializeEnvironment(): Promise<BootstrapResult> {
  let diagnostics: BootstrapResult = {
    success: true,
    environment: 'unknown',
    timestamp: new Date().toISOString(),
    services: [],
    warnings: [],
    errors: [],
  };

  try {
    // Collect bootstrap diagnostics information
    diagnostics = await getBootstrapDiagnostics();

    // Initialize vendors
    const { initializeVendors } = await import('../shared/external/vendors');
    await initializeVendors();
    logger.debug('[environment] ✅ Vendors initialized');

    return diagnostics;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    diagnostics.errors.push(errorMsg);
    diagnostics.success = false;

    // Phase 343: Standardized error handling (Critical - re-throw error)
    handleBootstrapError(error, { ...CRITICAL_ERROR_STRATEGY, context: 'environment' }, logger);

    // handleBootstrapError throws, so we don't reach here
    // Explicit return for TypeScript (unreachable code)
    return diagnostics;
  }
}
