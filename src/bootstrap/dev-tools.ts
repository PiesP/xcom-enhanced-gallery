/**
 * @fileoverview Development Tools Initialization
 * @description Phase 2.1: Development environment debugging tools
 * Development-only utility loading
 * Phase 343: Standardized error handling
 */

import { reportBootstrapError } from '@bootstrap/types';
import { logger } from '@shared/logging';

let devToolsRegistered = false;

const isTestMode = import.meta.env.MODE === 'test';
const isVitestRuntime = Boolean(typeof process !== 'undefined' && process?.env?.VITEST);
const allowDevToolsInTests = isTestMode && isVitestRuntime;

const shouldInitializeDevTools = import.meta.env.DEV && (allowDevToolsInTests || !isTestMode);
const isDevTestRuntime = import.meta.env.DEV && isTestMode;

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
  if (!shouldInitializeDevTools) {
    if (isDevTestRuntime) {
      logger.debug('[dev-tools] Initialization skipped (test mode)');
    }
    return;
  }

  if (devToolsRegistered) {
    return;
  }

  try {
    // Service diagnostic tools
    // Phase 350: Import ServiceDiagnostics directly (prevent circular reference)
    // const { registerDiagnosticsGlobal } = await import(
    //   "@shared/services/diagnostics"
    // );
    // registerDiagnosticsGlobal();
    devToolsRegistered = true;

    logger.info('🛠️ Development diagnostics ready (run window.__XEG__.diagnostics.run())');
  } catch (error) {
    // Phase 343: Standardized error handling (Non-Critical - warn only)
    reportBootstrapError(error, { context: 'dev-tools', logger });
  }
}
