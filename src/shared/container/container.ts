/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';
import type { MediaInfo } from '@shared/types/media.types';

// Re-export settings registry
export {
  getSettings,
  getTypedSettingOr,
  registerSettings,
  setTypedSetting,
  tryGetSettings,
  tryGetSettingsManager,
} from '@shared/container/settings-registry';

/**
 * Minimal interface for GalleryRenderer to avoid depending on the Features layer
 * from the Shared layer (DIP violation).
 */
export interface GalleryRendererLike {
  render(mediaItems: readonly MediaInfo[], options?: Record<string, unknown>): void;
  close(): void;
  isRendering(): boolean;
}

// ============================================================================
// Service Registry (module-level vars)
// ============================================================================

let _renderer: GalleryRendererLike | null = null;

export function registerGalleryRenderer(r: GalleryRendererLike): void {
  _renderer = r;
}

export function getRenderer(): GalleryRendererLike {
  if (!_renderer) throw new Error('GalleryRenderer not registered');
  return _renderer;
}

export function hasRenderer(): boolean {
  return _renderer !== null;
}

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
