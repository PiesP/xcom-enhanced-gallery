/**
 * @fileoverview Core service initialization logic
 * @description Phase 2: Integration and registration of unified services
 * @version 3.0.0 - Phase 370: Circular dependency resolution (Dynamic Import)
 */

import { logger } from '@shared/logging';

/**
 * Register integrated core layer services
 * Phase 2: Simplified registration after service unification
 * Phase 370: Use dynamic imports to eliminate circular references
 */
export async function registerCoreServices(): Promise<void> {
  // Phase 370: Dynamic imports to break circular dependencies
  const [{ CoreService }, { getMediaService }, { SERVICE_KEYS }] = await Promise.all([
    import('./core/core-service-manager'),
    import('./service-factories'),
    import('../../constants'),
  ]);

  // Always resolve the current CoreService singleton to avoid stale instance issues in tests
  const serviceManager = CoreService.getInstance();

  // ====================================
  // Integrated core services
  // ====================================

  // Unified media service
  const mediaService = await getMediaService();
  serviceManager.register(SERVICE_KEYS.MEDIA_SERVICE, mediaService);

  // Individual UI services share the singleton instances that are also managed
  // via BaseService registration to avoid divergent state between containers.
  const { themeService } = await import('./theme-service');
  serviceManager.register(SERVICE_KEYS.THEME, themeService);

  const { languageService } = await import('./language-service');
  serviceManager.register(SERVICE_KEYS.LANGUAGE, languageService);

  // ====================================
  // Services maintained independently
  // ====================================

  // Phase 308: BulkDownloadService moved to lazy registration
  // Not registered during app startup, dynamically loaded at first download
  // Filename service (imported as concrete module)
  const { FilenameService } = await import('./file-naming/filename-service');
  serviceManager.register(SERVICE_KEYS.MEDIA_FILENAME, new FilenameService());

  logger.info('Core services registered successfully');
}
