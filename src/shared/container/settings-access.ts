/**
 * @fileoverview Strict settings service accessors.
 * @version 2.0.0 - Phase 402 cleanup
 *
 * Provides thin wrappers around the registered SettingsService. Unlike the
 * previous implementation these helpers do not swallow errors or provide
 * implicit fallbacks when the service is missing. Callers are expected to
 * register the SettingsService during bootstrap before importing these
 * helpers. If the service is unavailable an error is thrown so the fault is
 * visible during development.
 */
import { tryGetSettingsManager } from './service-accessors';

interface SettingsServiceLike {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): Promise<void>;
}

function requireSettingsService(): SettingsServiceLike {
  const service = tryGetSettingsManager<SettingsServiceLike>();
  if (!service) {
    throw new Error(
      'SettingsService is not registered. Ensure bootstrap registers it before usage.'
    );
  }
  return service;
}

export function getSetting<T>(key: string, fallback: T): T {
  const value = requireSettingsService().get<T>(key);
  return value === undefined ? fallback : value;
}

export function setSetting<T>(key: string, value: T): Promise<void> {
  return requireSettingsService().set(key, value);
}

export function tryGetSettingsService(): SettingsServiceLike | null {
  return tryGetSettingsManager<SettingsServiceLike>();
}
