/**
 * @fileoverview Bootstrap Logging Utilities
 * @description Phase 347: Bootstrap logging logic separation
 * @module bootstrap/diagnostics/bootstrap-logger
 */

import { logger } from '../../shared/logging';
import type { BootstrapResult } from './types';

/**
 * Log bootstrap summary
 * Phase 347: Extracted from bootstrap-info.ts
 *
 * @param result Bootstrap result to log
 */
export function logBootstrapSummary(result: BootstrapResult): void {
  const serviceCount = result.services.length;
  const availableCount = result.services.filter(s => s.available).length;

  logger.info(
    `[bootstrap] Summary: ${result.environment} | Services: ${availableCount}/${serviceCount} | Status: ${result.success ? '✅' : '❌'}`
  );

  for (const service of result.services) {
    const status = service.available ? '✅' : '⚠️ ';
    logger.debug(`[bootstrap] ${status} ${service.name}: ${service.message}`);
  }

  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => logger.warn(`[bootstrap] ${warning}`));
  }

  if (result.errors.length > 0) {
    result.errors.forEach(error => logger.error(`[bootstrap] ${error}`));
  }
}

/**
 * Log environment information
 * Phase 347: Environment-specific logging helper
 *
 * @param environment Environment detection result
 */
export function logEnvironmentInfo(environment: {
  environment: string;
  isUserscriptEnvironment: boolean;
  isTestEnvironment: boolean;
  isBrowserExtension: boolean;
  isBrowserConsole: boolean;
  availableGMAPIs: string[];
}): void {
  if (environment.isUserscriptEnvironment) {
    logger.debug(
      `[bootstrap] ✅ Tampermonkey APIs available: ${environment.availableGMAPIs.join(', ')}`
    );
  } else if (environment.isTestEnvironment) {
    logger.debug('[bootstrap] 🧪 Test environment - using mock implementations');
  } else if (environment.isBrowserExtension) {
    logger.debug('[bootstrap] 🔌 Browser extension environment');
  } else if (environment.isBrowserConsole) {
    logger.warn('[bootstrap] ⚠️ Plain browser console environment');
  }
}
