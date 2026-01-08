/**
 * @fileoverview Settings service helper utilities
 * @description Shared utilities for path resolution, feature normalization, and validation.
 */

import { DEFAULT_SETTINGS } from '@constants/default-settings';
import type { FeatureFlags } from '@features/settings/types/settings.types';

const FORBIDDEN_PATH_KEYS = ['__proto__', 'constructor', 'prototype'] as const;

/** Check if a path segment is safe from prototype pollution */
export function isSafePathKey(key: string): boolean {
  return key !== '' && !FORBIDDEN_PATH_KEYS.includes(key as (typeof FORBIDDEN_PATH_KEYS)[number]);
}

/** Resolve nested object property by dot-notation path */
export function resolveNestedPath<T = unknown>(source: unknown, path: string): T | undefined {
  if (typeof path !== 'string' || path === '') {
    return undefined;
  }

  let current: unknown = source;
  const segments = path.split('.');

  for (const segment of segments) {
    if (!isSafePathKey(segment)) {
      return undefined;
    }
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current as T | undefined;
}

/** Assign value to nested object property by dot-notation path */
export function assignNestedPath(target: unknown, path: string, value: unknown): boolean {
  if (target === null || typeof target !== 'object') {
    return false;
  }
  if (typeof path !== 'string' || path === '') {
    return false;
  }

  const segments = path.split('.');

  const last = segments[segments.length - 1];
  if (!last || !isSafePathKey(last)) {
    return false;
  }

  let current = target as Record<string, unknown>;

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i];
    if (!segment || !isSafePathKey(segment)) {
      return false;
    }

    const existing = current[segment];
    if (existing === null || typeof existing !== 'object') {
      const next: Record<string, unknown> = {};
      current[segment] = next;
      current = next;
      continue;
    }

    current = existing as Record<string, unknown>;
  }

  current[last] = value;
  return true;
}

/** Normalize feature flags with safe defaults */
export function normalizeFeatureFlags(
  features?: Partial<Record<keyof FeatureFlags, unknown>>
): Readonly<Record<keyof FeatureFlags, boolean>> {
  const featureKeys = Object.keys(DEFAULT_SETTINGS.features) as Array<keyof FeatureFlags>;
  const featureDefaults = DEFAULT_SETTINGS.features as Record<keyof FeatureFlags, boolean>;

  return Object.freeze(
    featureKeys.reduce<Record<keyof FeatureFlags, boolean>>(
      (acc, key) => {
        const candidate = features?.[key];
        acc[key] = typeof candidate === 'boolean' ? candidate : featureDefaults[key];
        return acc;
      },
      {} as Record<keyof FeatureFlags, boolean>
    )
  );
}

/** Determine the type of a default value for validation */
export function getDefaultValueType(defaultValue: unknown): string {
  return Array.isArray(defaultValue) ? 'array' : typeof defaultValue;
}

/** Validate a setting value against its default type */
export function isValidSettingValue(defaultValue: unknown, value: unknown): boolean {
  if (defaultValue === undefined) return true;

  const type = getDefaultValueType(defaultValue);
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return typeof value === 'object' && value !== null;
  return typeof value === type;
}
