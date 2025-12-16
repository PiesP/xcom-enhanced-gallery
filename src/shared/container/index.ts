/**
 * Service container public surface. Re-export the small set of helpers that
 * runtime code and tests rely on.
 *
 * Note: FilenameService removed in v3.0.0 - use functional API instead:
 * import { generateMediaFilename, generateZipFilename } from '@shared/services/filename';
 */

export { createTestHarness, TestHarness } from '@shared/container/harness';
export {
  // Lazy-Loaded Service Getters
  getDownloadOrchestrator,
  getGalleryRenderer,
  getMediaService,
  // Service Getters
  getThemeService,
  // Service Registrations
  registerGalleryRenderer,
  registerSettingsManager,
  tryGetSettingsManager,
  // Warmup
  warmupCriticalServices,
  warmupNonCriticalServices,
} from '@shared/container/service-accessors';
