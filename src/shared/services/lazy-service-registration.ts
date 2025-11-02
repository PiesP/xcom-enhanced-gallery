/**
 * @fileoverview Lazy service registration for Phase 2a bundle optimization
 * @description Load services on-demand instead of during critical initialization
 * @phase Phase 308: Bundle Optimization - Phase 2a
 */

import { logger } from '../logging';

// Singleton pattern: track if service has been registered
let bulkDownloadServiceRegistered = false;

/**
 * Phase 2a: Lazy register BulkDownloadService
 *
 * Instead of registering during critical startup (Phase 1),
 * delay registration until first actual use (download action).
 *
 * Benefits:
 * - Removes 15-20 KB from initial bundle (not needed at startup)
 * - First download has 100-150ms delay (acceptable UX)
 * - Subsequent downloads are instant (service cached)
 *
 * Usage:
 * ```typescript
 * // In download action handlers
 * await ensureBulkDownloadServiceRegistered();
 * const bulkDownloadService = serviceManager.get(SERVICE_KEYS.BULK_DOWNLOAD);
 * ```
 */
export async function ensureBulkDownloadServiceRegistered(): Promise<void> {
  if (bulkDownloadServiceRegistered) {
    return;
  }

  try {
    // Dynamically import at first use
    const { BulkDownloadService } = await import('./bulk-download-service');
    const { CoreService } = await import('./service-manager');
    const { SERVICE_KEYS } = await import('../../constants');

    const serviceManager = CoreService.getInstance();
    const bulkDownloadService = new BulkDownloadService();

    // Register under both keys for compatibility
    serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, bulkDownloadService);
    serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, bulkDownloadService);

    bulkDownloadServiceRegistered = true;
    logger.info('✅ BulkDownloadService lazily registered (first download)');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to lazily register BulkDownloadService:', message);
    throw error;
  }
}

/**
 * Test utility: Reset lazy registration state
 * Use only in test teardown
 */
export function __resetLazyServiceRegistration(): void {
  bulkDownloadServiceRegistered = false;
}
