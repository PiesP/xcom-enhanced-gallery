/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

export type {
  SettingPath,
  SettingValue,
} from '@shared/container/settings-registry';
// Re-export settings registry for backward compatibility
export {
  getSettings,
  getTypedSettingOr,
  registerSettings,
  registerSettingsManager,
  setTypedSetting,
  tryGetSettings,
  tryGetSettingsManager,
} from '@shared/container/settings-registry';

/**
 * Minimal interface for GalleryRenderer to avoid depending on the Features layer
 * from the Shared layer (DIP violation).
 */
export interface GalleryRendererLike {
  render(
    mediaItems: readonly import('@shared/types/media.types').MediaInfo[],
    options?: Record<string, unknown>
  ): Promise<void>;
  close(): void;
  isRendering(): boolean;
}

// ============================================================================
// Service Registry (module-level vars)
// ============================================================================

let _renderer: GalleryRendererLike | null = null;

export function registerRenderer(r: GalleryRendererLike): void {
  _renderer = r;
}

export function getRenderer(): GalleryRendererLike {
  if (!_renderer) throw new Error('GalleryRenderer not registered');
  return _renderer;
}

export function hasRenderer(): boolean {
  return _renderer !== null;
}

// ============================================================================
// Singleton Service Accessors
// ============================================================================

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

let _downloadOrchestrator: DownloadOrchestrator | null = null;

export function getDownloadOrchestrator(): DownloadOrchestrator {
  if (!_downloadOrchestrator) {
    _downloadOrchestrator = DownloadOrchestrator.getInstance();
  }
  return _downloadOrchestrator;
}
