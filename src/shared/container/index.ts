/**
 * Service container public surface. Re-export the small set of helpers that
 * runtime code and tests rely on.
 */
export {
  // Service Getters
  getThemeService,
  getMediaFilenameService,
  getMediaServiceFromContainer,
  getGalleryRenderer,
  // Service Registrations
  registerGalleryRenderer,
  registerSettingsManager,
  tryGetSettingsManager,
  // Warmup
  warmupCriticalServices,
  warmupNonCriticalServices,
} from './service-accessors';
export { createTestHarness, TestHarness } from './harness';
