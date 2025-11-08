/**
 * @fileoverview Public exports for the settings feature.
 */

export * from './types/settings.types';

/**
 * Lazily create a settings service instance. Call {@link SettingsService.initialize}
 * on the returned object before using it.
 */
export async function initializeSettingsService() {
  const { SettingsService } = await import('./services/settings-service');
  return new SettingsService();
}
