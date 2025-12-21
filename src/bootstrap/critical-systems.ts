import { warmupCriticalServices } from '@shared/container/service-accessors';
import { logger } from '@shared/logging';
import { registerCoreServices } from '@shared/services/service-initialization';

export async function initializeCriticalSystems(): Promise<void> {
  if (__DEV__) {
    logger.debug('[critical] initialization started');
  }

  await registerCoreServices();
  warmupCriticalServices();
  if (__DEV__) {
    logger.debug('[critical] initialization complete');
  }
}
