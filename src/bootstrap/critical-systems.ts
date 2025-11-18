import { logger } from '@shared/logging';
import { warmupCriticalServices } from '@shared/container';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from '@/bootstrap/types';

const devLogger = import.meta.env.PROD ? null : logger;

export async function initializeCriticalSystems(): Promise<void> {
  devLogger?.debug('[critical] initialization started');

  try {
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    await registerCoreServices();
    warmupCriticalServices();
    devLogger?.debug('[critical] initialization complete');
  } catch (error) {
    handleBootstrapError(
      error,
      { ...CRITICAL_ERROR_STRATEGY, context: 'critical-systems' },
      logger
    );
  }
}
