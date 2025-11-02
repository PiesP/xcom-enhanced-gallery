/**
 * @fileoverview Bootstrap Information & Diagnostics - Phase 314-5
 * @description Service availability check, bootstrap result reporting,
 *              environment-aware initialization strategy
 * @module bootstrap/bootstrap-info
 */

import { logger } from '../shared/logging';
import { detectEnvironment } from '../shared/external/userscript';

/**
 * Service availability information - Phase 314-5
 */
export interface ServiceAvailabilityInfo {
  name: string;
  available: boolean;
  message: string;
}

/**
 * Bootstrap result summary - Phase 314-5
 */
export interface BootstrapResult {
  success: boolean;
  environment: string;
  timestamp: string;
  services: ServiceAvailabilityInfo[];
  warnings: string[];
  errors: string[];
}

/**
 * Check service availability for current environment - Phase 314-5
 *
 * Checks availability of critical services:
 * - HttpRequestService (fetch API)
 * - NotificationService (GM_notification)
 * - DownloadService (GM_download)
 * - PersistentStorage (GM_setValue)
 *
 * @returns Array of service availability information
 */
export async function checkServiceAvailability(): Promise<ServiceAvailabilityInfo[]> {
  const services: ServiceAvailabilityInfo[] = [];

  try {
    // Check HttpRequestService (fetch API is always available)
    services.push({
      name: 'HttpRequestService',
      available: typeof fetch !== 'undefined',
      message: 'HTTP requests (native fetch API)',
    });

    // Check NotificationService
    try {
      const { NotificationService } = await import('../shared/services');
      const notificationService = NotificationService.getInstance();
      const notificationProvider = await notificationService.getNotificationProvider();
      services.push({
        name: 'NotificationService',
        available: notificationProvider.available,
        message: `Notifications via ${notificationProvider.provider} provider`,
      });
    } catch {
      services.push({
        name: 'NotificationService',
        available: false,
        message: 'Failed to check notification availability',
      });
    }

    // Check DownloadService (check for GM_download)
    const gmDownload = (globalThis as Record<string, unknown>).GM_download;
    services.push({
      name: 'DownloadService',
      available: !!gmDownload,
      message: gmDownload
        ? 'GM_download available'
        : 'GM_download unavailable (test mode available)',
    });

    // Check PersistentStorage (check for GM_setValue)
    const gmSetValue = (globalThis as Record<string, unknown>).GM_setValue;
    services.push({
      name: 'PersistentStorage',
      available: !!gmSetValue,
      message: gmSetValue ? 'GM_setValue available' : 'LocalStorage fallback available',
    });
  } catch (error) {
    logger.warn('[bootstrap-info] Error checking service availability:', error);
  }

  return services;
}

/**
 * Log bootstrap summary - Phase 314-5
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
 * Get bootstrap diagnostics - Phase 314-5
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
    if (environment.isUserscriptEnvironment) {
      logger.debug(
        `[bootstrap] ✅ Tampermonkey APIs available: ${environment.availableGMAPIs.join(', ')}`
      );
    } else if (environment.isTestEnvironment) {
      logger.debug('[bootstrap] 🧪 Test environment - using mock implementations');
    } else if (environment.isBrowserExtension) {
      logger.debug('[bootstrap] 🔌 Browser extension environment');
    } else if (environment.isBrowserConsole) {
      result.warnings.push('⚠️ Plain browser console - limited functionality');
      logger.warn('[bootstrap] ⚠️ Plain browser console environment');
    }

    // Check service availability
    result.services = await checkServiceAvailability();

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
