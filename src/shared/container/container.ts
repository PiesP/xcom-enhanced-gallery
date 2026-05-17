/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

// Re-export settings registry
export {
  getSettings,
  getTypedSettingOr,
  registerSettings,
  setTypedSetting,
  tryGetSettings,
  tryGetSettingsManager,
} from '@shared/container/settings-registry';

export function getThemeService(): ThemeService {
  return ThemeService.getInstance();
}

export function getLanguageService(): LanguageService {
  return LanguageService.getInstance();
}

export function getMediaService(): MediaService {
  return MediaService.getInstance();
}

export function getDownloadOrchestrator(): DownloadOrchestrator {
  return DownloadOrchestrator.getInstance();
}
