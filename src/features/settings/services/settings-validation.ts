// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * Runtime validation for stored and runtime settings.
 *
 * Validates values at the unknown boundary (storage, imports) before they
 * enter the internal AppSettings type system. Uses DEFAULT_SETTINGS as
 * the source of truth for valid keys and types.
 */

import { DEFAULT_SETTINGS } from '@constants/settings';
import type { AppSettings, GallerySettings } from '@shared/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';

// ── Helpers ───────────────────────────────────────────────────────────────

const VALID_THEMES = new Set(['auto', 'light', 'dark']);
const VALID_IMAGE_FIT_MODES = new Set(['original', 'fitWidth', 'fitHeight', 'fitContainer']);
const VALID_VIDEO_CLICK_MODES = new Set(['block-all', 'block-controls-only', 'allow-all']);

/** Keys that must never be copied via spread to prevent prototype pollution. */
const FORBIDDEN_KEYS = new Set<string>(['__proto__', 'constructor', 'prototype']);

function isBoolean(value: unknown): value is boolean {
  return value === true || value === false;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFiniteRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function filterForbiddenKeys<T extends Record<string, unknown>>(obj: T): T {
  for (const key of FORBIDDEN_KEYS) {
    if (Object.hasOwn(obj, key)) {
      delete obj[key];
    }
  }
  return obj;
}

// ── Settings normalizer ───────────────────────────────────────────────────

/**
 * Normalize stored settings from an unknown storage value into a valid
 * AppSettings object. Rejects invalid types, NaN, Infinity, out-of-range
 * values, and prototype-pollution keys. Falls back to defaults for
 * invalid subtrees.
 *
 * @param input - Raw value from storage (may be null, array, primitive, or object)
 * @param nowMs - Current timestamp for lastModified field
 */
export function normalizeStoredSettings(input: unknown, nowMs: number): AppSettings {
  // Reject non-record input (null, arrays, primitives)
  if (!isRecord(input)) {
    return makeDefaults(nowMs);
  }

  const source = filterForbiddenKeys({ ...input }) as Record<string, unknown>;

  return {
    gallery: normalizeGallery(source.gallery as Record<string, unknown> | undefined),
    toolbar: normalizeToolbar(source.toolbar as Record<string, unknown> | undefined),
    download: {} as const,
    accessibility: {} as const,
    features: normalizeFeatures(source.features as Record<string, unknown> | undefined),
    version: typeof source.version === 'string' ? source.version : DEFAULT_SETTINGS.version,
    lastModified: nowMs,
  };
}

function makeDefaults(nowMs: number): AppSettings {
  return { ...DEFAULT_SETTINGS, lastModified: nowMs };
}

// ── Sub-normalizers ───────────────────────────────────────────────────────

function normalizeGallery(raw: Record<string, unknown> | undefined): GallerySettings {
  const d = DEFAULT_SETTINGS.gallery;
  if (!isRecord(raw)) return { ...d };

  return {
    preloadCount: isFiniteNonNegativeNumber(raw.preloadCount)
      ? Math.min(raw.preloadCount, 100)
      : d.preloadCount,
    imageFitMode:
      typeof raw.imageFitMode === 'string' && VALID_IMAGE_FIT_MODES.has(raw.imageFitMode)
        ? (raw.imageFitMode as GallerySettings['imageFitMode'])
        : d.imageFitMode,
    theme:
      typeof raw.theme === 'string' && VALID_THEMES.has(raw.theme)
        ? (raw.theme as GallerySettings['theme'])
        : d.theme,
    animations: isBoolean(raw.animations) ? raw.animations : d.animations,
    enableKeyboardNav: isBoolean(raw.enableKeyboardNav)
      ? raw.enableKeyboardNav
      : d.enableKeyboardNav,
    videoVolume: isFiniteRange(raw.videoVolume, 0, 1) ? raw.videoVolume : d.videoVolume,
    videoMuted: isBoolean(raw.videoMuted) ? raw.videoMuted : d.videoMuted,
    videoClickMode:
      typeof raw.videoClickMode === 'string' && VALID_VIDEO_CLICK_MODES.has(raw.videoClickMode)
        ? (raw.videoClickMode as GallerySettings['videoClickMode'])
        : d.videoClickMode,
  };
}

function normalizeToolbar(raw: Record<string, unknown> | undefined) {
  const d = DEFAULT_SETTINGS.toolbar;
  if (!isRecord(raw)) return { ...d };

  return {
    autoHideDelay: isFiniteNonNegativeNumber(raw.autoHideDelay)
      ? Math.min(raw.autoHideDelay, 60000)
      : d.autoHideDelay,
  };
}

function normalizeFeatures(raw: Record<string, unknown> | undefined) {
  const d = DEFAULT_SETTINGS.features;
  if (!isRecord(raw)) return { ...d };

  return {
    gallery: isBoolean(raw.gallery) ? raw.gallery : d.gallery,
    settings: isBoolean(raw.settings) ? raw.settings : d.settings,
    download: isBoolean(raw.download) ? raw.download : d.download,
    mediaExtraction: isBoolean(raw.mediaExtraction) ? raw.mediaExtraction : d.mediaExtraction,
    accessibility: isBoolean(raw.accessibility) ? raw.accessibility : d.accessibility,
  };
}

// ── Key-aware value validation ────────────────────────────────────────────

/**
 * Validate a setting value for a specific key path.
 * Rejects NaN, Infinity, invalid enums, out-of-range values, and
 * wrong types for known setting keys.
 */
export function validateSettingValue(key: string, value: unknown): boolean {
  // Reject forbidden keys immediately
  if (FORBIDDEN_KEYS.has(key)) return false;

  switch (key) {
    // Top-level object keys — accept only non-null objects
    case 'gallery':
    case 'toolbar':
    case 'download':
    case 'accessibility':
    case 'features':
      return isRecord(value);
    // gallery subtree
    case 'gallery.preloadCount':
      return isFiniteNonNegativeNumber(value) && value <= 100;
    case 'gallery.imageFitMode':
      return typeof value === 'string' && VALID_IMAGE_FIT_MODES.has(value);
    case 'gallery.theme':
      return typeof value === 'string' && VALID_THEMES.has(value);
    case 'gallery.animations':
    case 'gallery.enableKeyboardNav':
    case 'gallery.videoMuted':
      return isBoolean(value);
    case 'gallery.videoVolume':
      return isFiniteRange(value, 0, 1);
    case 'gallery.videoClickMode':
      return typeof value === 'string' && VALID_VIDEO_CLICK_MODES.has(value);
    // toolbar
    case 'toolbar.autoHideDelay':
      return isFiniteNonNegativeNumber(value) && value <= 60000;
    // features
    case 'features.gallery':
    case 'features.settings':
    case 'features.download':
    case 'features.mediaExtraction':
    case 'features.accessibility':
      return isBoolean(value);
    default:
      // Unknown key — reject for safety
      return false;
  }
}
