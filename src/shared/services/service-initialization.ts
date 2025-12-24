import { SERVICE_KEYS } from '@constants/service-keys';
import { CoreService } from '@shared/services/service-manager';
import {
  getLanguageServiceInstance,
  getMediaServiceInstance,
  getThemeServiceInstance,
} from '@shared/services/singletons';

/**
 * Register core services to the CoreService container.
 * This is called during application bootstrap.
 *
 * Note: Services are now accessed via ES Module singletons directly,
 * but we still register them with CoreService for backward compatibility
 * with dynamic lookups (e.g., GalleryRenderer, Settings).
 *
 * FilenameService removed in v3.0.0 - use functional API:
 * import { generateMediaFilename, generateZipFilename } from '@shared/services/filename';
 */
export function registerCoreServices(): void {
  const core = CoreService.getInstance();

  // Use singleton getters to ensure consistent instances.
  // Register only when missing to avoid duplicate-key warnings in development.
  if (!core.has(SERVICE_KEYS.THEME)) {
    core.register(SERVICE_KEYS.THEME, getThemeServiceInstance());
  }
  if (!core.has(SERVICE_KEYS.LANGUAGE)) {
    core.register(SERVICE_KEYS.LANGUAGE, getLanguageServiceInstance());
  }
  if (!core.has(SERVICE_KEYS.MEDIA_SERVICE)) {
    core.register(SERVICE_KEYS.MEDIA_SERVICE, getMediaServiceInstance());
  }
}
