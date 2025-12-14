import { warmupCriticalServices } from '@shared/container';
import { logger } from '@shared/logging';

const devLogger = import.meta.env.PROD ? null : logger;

export async function initializeCriticalSystems(): Promise<void> {
  devLogger?.debug('[critical] initialization started');

  const { registerCoreServices } = await import('@shared/services/service-initialization');
  await registerCoreServices();
  warmupCriticalServices();
  devLogger?.debug('[critical] initialization complete');
}
