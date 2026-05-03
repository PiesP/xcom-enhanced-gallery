import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import {
  getRenderer,
  registerRenderer,
  registerSettings,
  tryGetSettings,
} from '@shared/services/service-registry';
import { ThemeService } from '@shared/services/theme-service';

export { registerRenderer as registerGalleryRenderer };

export function getThemeService(): ThemeService {
  return ThemeService.getInstance();
}

export function getLanguageService(): LanguageService {
  return LanguageService.getInstance();
}

export function getMediaService(): MediaService {
  return MediaService.getInstance();
}

export function getGalleryRenderer() {
  return getRenderer();
}

export function registerSettingsManager(settings: unknown): void {
  registerSettings(settings as Parameters<typeof registerSettings>[0]);
}

export function tryGetSettingsManager<T = unknown>(): T | null {
  return tryGetSettings() as T | null;
}

let _downloadOrchestrator: DownloadOrchestrator | null = null;

export function getDownloadOrchestrator(): DownloadOrchestrator {
  if (!_downloadOrchestrator) {
    _downloadOrchestrator = DownloadOrchestrator.getInstance();
  }
  return _downloadOrchestrator;
}
