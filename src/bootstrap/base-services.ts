/**
 * @fileoverview Core base services initialization for application bootstrap.
 *
 * Initializes and registers essential services (theme, language, media) required
 * for application functionality.
 */

import { SERVICE_KEYS } from '@constants/service-keys';
import { logger } from '@shared/logging/logger';
import { registerCoreServices } from '@shared/services/service-initialization';
import { CoreService } from '@shared/services/service-manager';
import type { BaseService } from '@shared/types/core/base-service.types';

/**
 * Initialize core base services (theme, language, media).
 *
 * Registers and initializes services sequentially. Safe to call in isolated
 * environments (e.g., tests) as it ensures services are registered first.
 *
 * @throws Error if any service initialization fails
 */
export async function initializeCoreBaseServices(): Promise<void> {
  try {
    registerCoreServices();

    const coreService = CoreService.getInstance();
    const serviceKeys = [
      SERVICE_KEYS.THEME,
      SERVICE_KEYS.LANGUAGE,
      SERVICE_KEYS.MEDIA_SERVICE,
    ] as const;

    for (const key of serviceKeys) {
      const service = coreService.get<BaseService>(key);
      if (service?.initialize) {
        await service.initialize();
      }
    }

    if (__DEV__) {
      logger.debug('[base-services] Base services ready');
    }
  } catch (error) {
    throw new Error('[base-services] initialization failed', {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }
}
