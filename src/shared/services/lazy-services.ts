/**
 * Lazily-registered services.
 *
 * This module centralizes registration that is only needed on-demand.
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { logger } from '@shared/logging';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { CoreService } from '@shared/services/service-manager';

let isDownloadServiceRegistered = false;

export function __resetLazyServiceRegistration(): void {
  isDownloadServiceRegistered = false;
}

export async function ensureDownloadServiceRegistered(): Promise<void> {
  if (isDownloadServiceRegistered) {
    return;
  }

  try {
    const orchestrator = DownloadOrchestrator.getInstance();
    CoreService.getInstance().register(SERVICE_KEYS.GALLERY_DOWNLOAD, orchestrator);
    isDownloadServiceRegistered = true;
  } catch (error) {
    logger.error('[lazy-services] Failed to register download service', error);
    throw error;
  }
}
