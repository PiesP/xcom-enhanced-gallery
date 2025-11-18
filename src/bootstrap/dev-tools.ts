/**
 * @fileoverview Development Tools Initialization
 * @description Phase 2.1: Development environment debugging tools
 * Development-only utility loading
 * Phase 343: Standardized error handling
 */

import { logger } from '@shared/logging';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from '@/bootstrap/types';

let devToolsRegistered = false;

/**
 * Development environment debugging tools initialization
 *
 * Responsibilities:
 * - Load service diagnostic tools
 * - Register global diagnostic API
 * - Diagnose ServiceManager state
 * - Phase 420.3: Initialize listener profiler
 *
 * Phase 343: Non-Critical system - warn on failure only
 *
 * @note Development environment only (tree-shaken in production)
 */
export async function initializeDevTools(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (devToolsRegistered) {
    return;
  }

  try {
    // Service diagnostic tools
    // Phase 350: Import ServiceDiagnostics directly (prevent circular reference)
    const { registerDiagnosticsGlobal } = await import('@shared/services/diagnostics');
    registerDiagnosticsGlobal();
    devToolsRegistered = true;

    logger.info('🛠️ Development diagnostics ready (run window.__XEG__.diagnostics.run())');
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    handleBootstrapError(error, { ...NON_CRITICAL_ERROR_STRATEGY, context: 'dev-tools' }, logger);
  }
}
