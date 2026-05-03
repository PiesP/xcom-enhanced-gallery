/**
 * Minimal module-level service registry for runtime-registered services.
 * Replaces the CoreService Service Locator + SERVICE_KEYS DI system.
 * Singleton services (ThemeService, LanguageService, MediaService)
 * use their own getInstance() — no registry needed.
 */

import type { GalleryRenderer } from '@features/gallery/GalleryRenderer';

// Gallery renderer (registered during bootstrap)
let _renderer: GalleryRenderer | null = null;

export function registerRenderer(r: GalleryRenderer): void {
  _renderer = r;
}

export function getRenderer(): GalleryRenderer {
  if (!_renderer) throw new Error('GalleryRenderer not registered');
  return _renderer;
}

export function hasRenderer(): boolean {
  return _renderer !== null;
}

// Settings service (registered during bootstrap)
interface SettingsLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
  initialize?(): Promise<void>;
  isInitialized?(): boolean;
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
