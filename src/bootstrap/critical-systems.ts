/**
 * @fileoverview Critical systems initialization for application bootstrap.
 *
 * Registers core services with the service container for dependency injection
 * and service discovery throughout the application.
 */

import { logger } from '@shared/logging/logger';
import { registerCoreServices } from '@shared/services/service-initialization';

/**
 * Initialize critical systems by registering core services.
 *
 * Registers theme, language, media, settings, and gallery services in the
 * service container. Only registers services; initialization is performed
 * later in the bootstrap pipeline.
 *
 * @throws Error if service registration fails
 */
export async function initializeCriticalSystems(): Promise<void> {
  if (__DEV__) {
    logger.debug('[critical] initialization started');
  }

  registerCoreServices();

  if (__DEV__) {
    logger.debug('[critical] initialization complete');
  }
}
