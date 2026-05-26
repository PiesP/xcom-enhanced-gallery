// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

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

// ============================================================================
// Type-Safe Settings Access
// ============================================================================

/** Recursively extract all dot-notation paths from a nested object type */
type SettingPaths<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${Prefix}${K}` | SettingPaths<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

/** Resolve the value type at a given dot-notation path */
type SettingValueAt<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? SettingValueAt<T[K], Rest>
    : never
  : Path extends keyof T
    ? T[Path]
    : never;

type SettingPath = SettingPaths<AppSettings>;

function requireSettingsService(): SettingsLike {
  const service = tryGetSettings();
  if (!service) {
    throw new Error('SettingsService not registered.');
  }
  return service;
}

/** Get a typed setting value, falling back to default if unset */
export function getTypedSettingOr<P extends SettingPath>(
  path: P,
  fallback: SettingValueAt<AppSettings, P>
): SettingValueAt<AppSettings, P> {
  const value = requireSettingsService().get(path) as SettingValueAt<AppSettings, P> | undefined;
  return value === undefined ? fallback : value;
}

/** Set a typed setting value */
export function setTypedSetting<P extends SettingPath>(
  path: P,
  value: SettingValueAt<AppSettings, P>
): Promise<void> {
  return requireSettingsService().set(path, value);
}
