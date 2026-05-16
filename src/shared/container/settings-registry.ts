/**
 * @fileoverview Settings registry for type-safe settings access.
 * Extracted from container.ts to break the circular dependency
 * container.ts → theme-service.ts → container.ts
 */

import type { AppSettings } from '@shared/types/settings.types';

/**
 * Minimal settings service interface used internally for type-safe access.
 */
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

export function tryGetSettingsManager<T = unknown>(): T | null {
  return tryGetSettings() as T | null;
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
