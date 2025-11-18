import { logger } from '@shared/logging';
import { warmupCriticalServices } from '@shared/container';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from '@/bootstrap/types';

const debugEnabled = !import.meta.env.PROD;
const debug = (message: string): void => {
  if (debugEnabled) {
    logger.debug(`[critical] ${message}`);
  }
};

async function registerCoreLayer(): Promise<void> {
  const { registerCoreServices } = await import('@shared/services/service-initialization');
  await registerCoreServices();
}

export async function initializeCriticalSystems(): Promise<void> {
  debug('initialization started');

  try {
    await registerCoreLayer();
    warmupCriticalServices();
    debug('initialization complete');
  } catch (error) {
    handleBootstrapError(
      error,
      { ...CRITICAL_ERROR_STRATEGY, context: 'critical-systems' },
      logger
    );
  }
}
