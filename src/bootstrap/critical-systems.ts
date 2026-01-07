/**
 * @fileoverview Critical systems initialization for application bootstrap
 *
 * Handles the registration of core services required for the application to function properly.
 * This module is responsible for initializing critical infrastructure before feature-specific
 * services are loaded.
 *
 * ## Initialization Process
 *
 * 1. **Service Registration**: Registers all core services with the service container
 * 2. **Dependency Setup**: Ensures service dependencies are properly wired
 * 3. **Debug Logging**: Provides visibility into the initialization process (dev mode only)
 *
 * ## Service Registration
 *
 * Core services registered include:
 * - Theme management services
 * - Language/i18n services
 * - Media handling services
 * - Settings management
 * - Gallery rendering services
 *
 * ## Bootstrap Context
 *
 * This is invoked early in the application lifecycle, typically after environment validation
 * but before user-facing features are initialized. It establishes the foundation for
 * dependency injection and service discovery throughout the application.
 *
 * @see {@link registerCoreServices} for service registration implementation
 */

import { logger } from '@shared/logging/logger';
import { registerCoreServices } from '@shared/services/service-initialization';

/**
 * Initialize critical systems required for application bootstrap
 *
 * Registers core services with the service container to enable dependency injection
 * and service discovery throughout the application. This function is idempotent and
 * safe to call multiple times, though typically invoked once during application startup.
 *
 * The initialization process includes:
 * 1. Registering all core services (theme, language, media, settings, gallery)
 * 2. Wiring service dependencies
 * 3. Logging initialization progress in development mode
 *
 * This function does not initialize the services themselves (call their `initialize()`
 * methods) - it only registers them in the container. Service initialization is performed
 * later in the bootstrap pipeline.
 *
 * @returns Promise that resolves when critical systems are registered
 * @throws {Error} If service registration fails (propagated from registerCoreServices)
 *
 * @example
 * ```typescript
 * // Invoked during application bootstrap
 * await initializeCriticalSystems();
 * // Services are now registered and can be accessed via service accessors
 * const themeService = getThemeService();
 * ```
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
