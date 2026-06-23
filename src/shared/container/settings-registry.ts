// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Settings registry for type-safe settings access.
 * Extracted from container.ts to break the circular dependency
 * container.ts → theme-service.ts → container.ts
 */

import type { AppSettings, NestedSettingKey } from '@shared/types/settings.types';

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

export function tryGetSettings(): SettingsLike | null {
  return _settings;
}

/** Clear settings reference (called during cleanup) */
export function clearSettings(): void {
  _settings = null;
}

// ============================================================================
// Type-Safe Settings Access
// ============================================================================

/** Resolve the value type for a known nested setting key */
type SettingValueAt<Path extends NestedSettingKey> =
  Path extends `${infer K extends keyof AppSettings & string}.${infer Rest extends string}`
    ? AppSettings[K] extends Record<Rest, infer V>
      ? V
      : never
    : Path extends keyof AppSettings
      ? AppSettings[Path]
      : never;

function requireSettingsService(): SettingsLike {
  const service = tryGetSettings();
  if (!service) {
    throw new Error('SettingsService not registered.');
  }
  return service;
}

/** Get a typed setting value, falling back to default if unset */
export function getTypedSettingOr<P extends NestedSettingKey>(
  path: P,
  fallback: SettingValueAt<P>
): SettingValueAt<P> {
  const value = requireSettingsService().get(path) as SettingValueAt<P> | undefined;
  return value === undefined ? fallback : value;
}

/** Set a typed setting value */
export function setTypedSetting<P extends NestedSettingKey>(
  path: P,
  value: SettingValueAt<P>
): Promise<void> {
  return requireSettingsService().set(path, value);
}
