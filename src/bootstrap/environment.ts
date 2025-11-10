/**
 * @fileoverview Runtime Environment Initialization - Phase 314-5
 * @description Vendor library and runtime environment initialization, service availability check
 * @module bootstrap/environment
 */

import { logger } from '../shared/logging';
import type { BootstrapResult } from './diagnostics/types';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

function createBootstrapSkeleton(environment: string): BootstrapResult {
  return {
    success: true,
    environment,
    timestamp: new Date().toISOString(),
    services: [],
    warnings: [],
    errors: [],
  };
}

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
  const shouldCollectDiagnostics = !import.meta.env.PROD;
  let diagnostics = createBootstrapSkeleton(shouldCollectDiagnostics ? 'unknown' : 'production');

  try {
    if (shouldCollectDiagnostics) {
      const { getBootstrapDiagnostics } = await import('./diagnostics/collector');
      diagnostics = await getBootstrapDiagnostics();
    }

    // Initialize vendors
    const { initializeVendors } = await import('../shared/external/vendors');
    await initializeVendors();

    if (!import.meta.env.PROD) {
      logger.debug('[environment] ✅ Vendors initialized');
    }

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
