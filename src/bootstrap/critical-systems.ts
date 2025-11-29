import { warmupCriticalServices } from '@shared/container';
import { bootstrapErrorReporter } from '@shared/error';
import { logger } from '@shared/logging';

const devLogger = import.meta.env.PROD ? null : logger;

export async function initializeCriticalSystems(): Promise<void> {
  devLogger?.debug('[critical] initialization started');

  try {
    const { registerCoreServices } = await import('@shared/services/service-initialization');
    await registerCoreServices();
    warmupCriticalServices();
    devLogger?.debug('[critical] initialization complete');
  } catch (error) {
    bootstrapErrorReporter.critical(error, {
      code: 'CRITICAL_SYSTEMS_INIT_FAILED',
    });
  }
}
