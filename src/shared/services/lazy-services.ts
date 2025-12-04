/**
 * @fileoverview Lazy service registration for Phase 2a bundle optimization
 * @description Load services on-demand instead of during critical initialization
 * @phase Phase 308: Bundle Optimization - Phase 2a
 * @phase Phase 355: Download Service Consolidation (BulkDownloadService removed)
 */

import { logger } from '@shared/logging';

// Singleton pattern: track if service has been registered
let downloadServiceRegistered = false;

/**
 * Phase 2a: Lazy register DownloadService
 *
 * Instead of registering during critical startup (Phase 1),
 * delay registration until first actual use (download action).
 *
 * Benefits:
 * - Removes 15-20 KB from initial bundle (not needed at startup)
 * - First download has 100-150ms delay (acceptable UX)
 * - Subsequent downloads are instant (service cached)
 *
 * Phase 355: Consolidated from BulkDownloadService (now uses DownloadService)
 *
 * Usage:
 * ```typescript
 * // In download action handlers
 * await ensureDownloadServiceRegistered();
 * const downloadService = serviceManager.get(SERVICE_KEYS.GALLERY_DOWNLOAD);
 * ```
 */
export async function ensureDownloadServiceRegistered(): Promise<void> {
  if (downloadServiceRegistered) {
    return;
  }

  try {
    // Dynamically import at first use
    const { DownloadOrchestrator } = await import('./download/download-orchestrator');
    const downloadService = DownloadOrchestrator.getInstance();
    const { CoreService } = await import('./service-manager');
    const { SERVICE_KEYS } = await import('@constants');

    const serviceManager = CoreService.getInstance();

    // Register under both keys for compatibility
    serviceManager.register(SERVICE_KEYS.GALLERY_DOWNLOAD, downloadService);
    // BULK_DOWNLOAD is now an alias for GALLERY_DOWNLOAD (Phase 355)
    serviceManager.register(SERVICE_KEYS.BULK_DOWNLOAD, downloadService);

    downloadServiceRegistered = true;
    logger.info('✅ DownloadService lazily registered (first download)');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('❌ Failed to lazily register DownloadService:', message);
    throw error;
  }
}

/**
 * Test utility: Reset lazy registration state
 * Use only in test teardown
 */
export function __resetLazyServiceRegistration(): void {
  downloadServiceRegistered = false;
}
