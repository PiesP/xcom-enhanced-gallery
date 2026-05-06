/**
 * @fileoverview Service registry, type-safe settings access, and singleton accessors.
 */

import type { AppSettings } from '@features/settings/types/settings.types';
import { DownloadOrchestrator } from '@shared/services/download/download-orchestrator';
import { LanguageService } from '@shared/services/language-service';
import { MediaService } from '@shared/services/media-service';
import { ThemeService } from '@shared/services/theme-service';

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

interface SettingsLike {
  get(key: string): unknown;
  set(key: string, value: unknown): Promise<void>;
}

let _settings: SettingsLike | null = null;

export function registerSettings(s: SettingsLike): void {
  _settings = s;
}

export function getSettings(): SettingsLike {
  if (!_settings) throw new Error('SettingsService not registered');
  return _settings;
}

export function tryGetSettings(): SettingsLike | null {
  return _settings;
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

export function registerSettingsManager(settings: SettingsLike): void {
  registerSettings(settings);
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

// ============================================================================
// Type-Safe Settings Access
// ============================================================================

type SettingPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | SettingPaths<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

type SettingValueAt<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? SettingValueAt<T[K], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

export type SettingPath = SettingPaths<AppSettings>;
export type SettingValue<P extends SettingPath> = SettingValueAt<AppSettings, P>;

function requireSettingsService(): SettingsLike {
  const service = tryGetSettings();
  if (!service) {
    throw new Error('SettingsService not registered.');
  }
  return service;
}

export function getTypedSettingOr<P extends SettingPath>(
  path: P,
  fallback: SettingValue<P>
): SettingValue<P> {
  const value = requireSettingsService().get(path) as SettingValue<P> | undefined;
  return value === undefined ? fallback : value;
}

export function setTypedSetting<P extends SettingPath>(
  path: P,
  value: SettingValue<P>
): Promise<void> {
  return requireSettingsService().set(path, value);
}
