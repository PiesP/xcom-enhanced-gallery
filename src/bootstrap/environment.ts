/**
 * @fileoverview Runtime Environment Initialization - Phase 314-5
 * @description Vendor library and runtime environment initialization, service availability check
 * @module bootstrap/environment
 */

import { logger } from '@shared/logging';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from '@/bootstrap/types';

const shouldRunDiagnostics = (): boolean => import.meta.env.DEV && import.meta.env.MODE !== 'test';

async function runDiagnosticsIfEnabled(): Promise<void> {
  if (!shouldRunDiagnostics()) {
    return;
  }

  try {
    const { getBootstrapDiagnostics } = await import('./diagnostics/collector');
    await getBootstrapDiagnostics();
  } catch (error) {
    logger.warn('[environment] Diagnostics skipped due to error', error);
  }
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
 */
export async function initializeEnvironment(): Promise<void> {
  const diagnosticsTask = runDiagnosticsIfEnabled();

  try {
    const { initializeVendors } = await import('@shared/external/vendors');
    await initializeVendors();

    if (!import.meta.env.PROD) {
      logger.debug('[environment] ✅ Vendors initialized');
    }
  } catch (error) {
    // Phase 343: Standardized error handling (Critical - re-throw error)
    handleBootstrapError(error, { ...CRITICAL_ERROR_STRATEGY, context: 'environment' }, logger);
  }

  await diagnosticsTask;
}
