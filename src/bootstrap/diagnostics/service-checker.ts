/**
 * @fileoverview Service Availability Checker
 * @description Phase 347: Service availability check logic separation
 * @module bootstrap/diagnostics/service-checker
 */

import type { ServiceAvailabilityInfo } from './types';

/**
 * Check HttpRequestService availability
 * Phase 347: Extracted from bootstrap-info.ts
 */
export async function checkHttpService(): Promise<ServiceAvailabilityInfo> {
  return {
    name: 'HttpRequestService',
    available: typeof fetch !== 'undefined',
    message: 'HTTP requests (native fetch API)',
  };
}

/**
 * Check NotificationService availability
 * Phase 347: Extracted from bootstrap-info.ts
 */
export async function checkNotificationService(): Promise<ServiceAvailabilityInfo> {
  try {
    const { NotificationService } = await import('../../shared/services');
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
 * Phase 347: Extracted from bootstrap-info.ts
 */
export async function checkDownloadService(): Promise<ServiceAvailabilityInfo> {
  const gmDownload = (globalThis as Record<string, unknown>).GM_download;
  return {
    name: 'DownloadService',
    available: !!gmDownload,
    message: gmDownload ? 'GM_download available' : 'GM_download unavailable (test mode available)',
  };
}

/**
 * Check PersistentStorage availability (GM_setValue)
 * Phase 347: Extracted from bootstrap-info.ts
 */
export async function checkPersistentStorage(): Promise<ServiceAvailabilityInfo> {
  const gmSetValue = (globalThis as Record<string, unknown>).GM_setValue;
  return {
    name: 'PersistentStorage',
    available: !!gmSetValue,
    message: gmSetValue ? 'GM_setValue available' : 'LocalStorage fallback available',
  };
}

/**
 * Check all services in parallel
 * Phase 347: Main entry point for service checking
 *
 * @returns Array of service availability information
 */
export async function checkAllServices(): Promise<ServiceAvailabilityInfo[]> {
  const checks = [
    checkHttpService(),
    checkNotificationService(),
    checkDownloadService(),
    checkPersistentStorage(),
  ];

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
