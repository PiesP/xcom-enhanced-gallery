import { warmupCriticalServices } from '@shared/container';
import { logger } from '@shared/logging';
import { registerCoreServices } from '@shared/services/service-initialization';

const devLogger = import.meta.env.PROD ? null : logger;

export async function initializeCriticalSystems(): Promise<void> {
  devLogger?.debug('[critical] initialization started');

  await registerCoreServices();
  warmupCriticalServices();
  devLogger?.debug('[critical] initialization complete');
}
