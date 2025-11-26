import { warmupCriticalServices } from '@shared/container';
import { logger } from '@shared/logging';
import { reportBootstrapError } from '@/bootstrap/types';

const devLogger = import.meta.env.PROD ? null : logger;

export async function initializeCriticalSystems(): Promise<void> {
  devLogger?.debug('[critical] initialization started');

  try {
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    await registerCoreServices();
    warmupCriticalServices();
    devLogger?.debug('[critical] initialization complete');
  } catch (error) {
    reportBootstrapError(error, {
      context: 'critical-systems',
      severity: 'critical',
      logger,
    });
  }
}
