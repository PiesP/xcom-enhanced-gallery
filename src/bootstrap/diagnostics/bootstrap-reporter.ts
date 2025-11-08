/**
 * @fileoverview Bootstrap Diagnostics Reporter
 * @description Phase 347: Bootstrap diagnostics information aggregation
 * @module bootstrap/diagnostics/bootstrap-reporter
 */

import { logger } from '../../shared/logging';
import { detectEnvironment } from '../../shared/external/userscript';
import { checkAllServices } from './service-checker';
import { logBootstrapSummary, logEnvironmentInfo } from './bootstrap-logger';
import type { BootstrapResult } from './types';

/**
 * Get bootstrap diagnostics
 * Phase 347: Extracted from bootstrap-info.ts
 *
 * Comprehensive bootstrap information including environment,
 * services, warnings, and errors.
 *
 * @returns Promise<BootstrapResult>
 */
export async function getBootstrapDiagnostics(): Promise<BootstrapResult> {
  const result: BootstrapResult = {
    success: true,
    environment: 'unknown',
    timestamp: new Date().toISOString(),
    services: [],
    warnings: [],
    errors: [],
  };

  try {
    // Detect environment
    const environment = detectEnvironment();
    result.environment = environment.environment;

    // Environment-specific logging
    logEnvironmentInfo(environment);

    // Add warning for browser console
    if (environment.isBrowserConsole) {
      result.warnings.push('⚠️ Plain browser console - limited functionality');
    }

    // Check service availability
    result.services = await checkAllServices();

    // Log summary
    logBootstrapSummary(result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);
    result.success = false;
    logger.error('[bootstrap] Bootstrap diagnostics error:', error);
  }

  return result;
}
