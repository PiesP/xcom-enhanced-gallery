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

  // Duplicate registration for compatibility with existing keys
  serviceManager.register(SERVICE_KEYS.MEDIA_EXTRACTION, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_CONTROL, mediaService);
  serviceManager.register(SERVICE_KEYS.VIDEO_STATE, mediaService);

  // Individual UI services
  const { ThemeService } = await import('./theme-service');
  const { toastManager } = await import('./unified-toast-manager');

  const themeService = new ThemeService();

  serviceManager.register(SERVICE_KEYS.THEME, themeService);
  serviceManager.register(SERVICE_KEYS.TOAST, toastManager);

  // Phase 268-3: Conditional registration of backward compatibility keys
  // Register only in test environment to remove production warnings
  if (import.meta.env.MODE === 'test') {
    // Test-only keys (backward compatibility)
    serviceManager.register('theme.service', themeService);
    serviceManager.register('toast.manager', toastManager);
  }

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
