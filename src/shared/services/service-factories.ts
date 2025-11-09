import type { MediaService } from './media-service';

let mediaServiceInstance: Promise<MediaService> | null = null;

export async function getMediaService(): Promise<MediaService> {
  if (!mediaServiceInstance) {
    mediaServiceInstance = import('./media-service').then(async m => {
      const service = m.MediaService.getInstance();
      // Ensure initialization to load MediaExtractionService dynamically
      await service.initialize();
      return service;
    });
  }
  return mediaServiceInstance;
}

// SettingsService factory lives in the feature layer (shared cannot import features directly)
// By contract (test), getSettingsService function export must exist, so error is thrown on call.
// Use initializeSettingsService() from @features/settings instead of this stub.
export async function getSettingsService(): Promise<never> {
  throw new Error('getSettingsService(): Use initializeSettingsService() from @features/settings');
}

export function __resetServiceFactories(): void {
  mediaServiceInstance = null;
}
