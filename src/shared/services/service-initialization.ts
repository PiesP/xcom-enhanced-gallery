import { SERVICE_KEYS } from '@constants';
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
export async function registerCoreServices(): Promise<void> {
  const core = CoreService.getInstance();

  // Use singleton getters to ensure consistent instances
  // This also initializes the singletons if not already created
  core.register(SERVICE_KEYS.THEME, getThemeServiceInstance());
  core.register(SERVICE_KEYS.LANGUAGE, getLanguageServiceInstance());
  core.register(SERVICE_KEYS.MEDIA_SERVICE, getMediaServiceInstance());
}
