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
 * Check service availability for current environment - Phase 314-5, Phase 344
 *
 * Checks availability of critical services:
 * - HttpRequestService (fetch API)
 * - NotificationService (GM_notification)
 * - DownloadService (GM_download)
 * - PersistentStorage (GM_setValue)
 *
 * Phase 344: Promise.allSettled로 병렬 체크 (30-50ms 단축)
 *
 * @returns Array of service availability information
 */
export async function checkServiceAvailability(): Promise<ServiceAvailabilityInfo[]> {
  // Phase 344: 각 서비스 체크를 독립적인 함수로 분리
  const checks = [
    checkHttpService(),
    checkNotificationService(),
    checkDownloadService(),
    checkPersistentStorage(),
  ];

  // 병렬 실행 (실패해도 계속 진행)
  const results = await Promise.allSettled(checks);

  return results.map(result =>
    result.status === 'fulfilled'
      ? result.value
      : {
          name: 'Unknown',
          available: false,
          message: 'Check failed',
        }
  );
}

/**
 * Check HttpRequestService availability
 * @internal
 */
async function checkHttpService(): Promise<ServiceAvailabilityInfo> {
  return {
    name: 'HttpRequestService',
    available: typeof fetch !== 'undefined',
    message: 'HTTP requests (native fetch API)',
  };
}

/**
 * Check NotificationService availability
 * @internal
 */
async function checkNotificationService(): Promise<ServiceAvailabilityInfo> {
  try {
    const { NotificationService } = await import('../shared/services');
    const notificationService = NotificationService.getInstance();
    const notificationProvider = await notificationService.getNotificationProvider();
    return {
      name: 'NotificationService',
      available: notificationProvider.available,
      message: `Notifications via ${notificationProvider.provider} provider`,
    };
  } catch {
    return {
      name: 'NotificationService',
      available: false,
      message: 'Failed to check notification availability',
    };
  }
}

/**
 * Check DownloadService availability (GM_download)
 * @internal
 */
async function checkDownloadService(): Promise<ServiceAvailabilityInfo> {
  const gmDownload = (globalThis as Record<string, unknown>).GM_download;
  return {
    name: 'DownloadService',
    available: !!gmDownload,
    message: gmDownload ? 'GM_download available' : 'GM_download unavailable (test mode available)',
  };
}

/**
 * Check PersistentStorage availability (GM_setValue)
 * @internal
 */
async function checkPersistentStorage(): Promise<ServiceAvailabilityInfo> {
  const gmSetValue = (globalThis as Record<string, unknown>).GM_setValue;
  return {
    name: 'PersistentStorage',
    available: !!gmSetValue,
    message: gmSetValue ? 'GM_setValue available' : 'LocalStorage fallback available',
  };
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
