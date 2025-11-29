/**
 * Service container public surface. Re-export the small set of helpers that
 * runtime code and tests rely on.
 */

export { createTestHarness, TestHarness } from './harness';
export {
  // Lazy-Loaded Service Getters
  getDownloadOrchestrator,
  getGalleryRenderer,
  getMediaFilenameService,
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
} from './service-accessors';
