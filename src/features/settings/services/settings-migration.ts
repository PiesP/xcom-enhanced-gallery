// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { isVideoClickMode } from '@constants/setting-options';
import { DEFAULT_SETTINGS } from '@constants/settings';
import type { AppSettings, VideoClickMode } from '@shared/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';

function pruneWithTemplate<T extends Record<string, unknown>>(
  input: unknown,
  template: T,
  depth = 0
): Partial<T> {
  if (!isRecord(input)) return {} as Partial<T>;
  if (depth > 10) return {} as Partial<T>; // Guard against deeply nested/corrupt data

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(template) as Array<keyof T>) {
    const tplVal = template[key];
    const inVal = input[key as string];
    if (inVal === undefined) continue;

    if (isRecord(tplVal) && !Array.isArray(tplVal)) {
      out[key as string] = pruneWithTemplate(inVal, tplVal, depth + 1);
    } else {
      out[key as string] = inVal;
    }
  }
  return out as Partial<T>;
}

/**
 * Migrate legacy `blockVideoControlClick` + `preciseVideoControlDetection`
 * booleans to the unified `videoClickMode` enum.
 */
function migrateVideoClickMode(
  gallery: Record<string, unknown>
): Partial<{ videoClickMode: VideoClickMode }> {
  const blockAll = gallery.blockVideoControlClick as boolean | undefined;
  const precise = gallery.preciseVideoControlDetection as boolean | undefined;

  // Legacy fields are stripped by pruneWithTemplate in the caller

  // If the new field already exists with a valid value, keep it
  if (isVideoClickMode(gallery.videoClickMode)) {
    return {};
  }
  // Invalid values are treated as unmigrated and fall through to legacy conversion.

  // Convert legacy booleans to enum
  if (blockAll === false) {
    return { videoClickMode: 'allow-all' };
  }
  if (blockAll === true && precise === false) {
    return { videoClickMode: 'block-all' };
  }
  // Default: blockControlsOnly (block=true, precise=true or undefined)
  if (blockAll !== undefined) {
    return { videoClickMode: 'block-controls-only' };
  }

  return {};
}

export function migrateSettings(input: unknown, nowMs: number): AppSettings {
  if (!isRecord(input)) {
    return {
      ...DEFAULT_SETTINGS,
      version: DEFAULT_SETTINGS.version,
      lastModified: nowMs,
    } as AppSettings;
  }

  let migratedInput: Record<string, unknown> = input;

  // Migrate legacy video click mode before pruning (pruning strips old fields)
  if (isRecord(input.gallery)) {
    migratedInput = {
      ...input,
      gallery: {
        ...input.gallery,
        ...migrateVideoClickMode(input.gallery),
      },
    };
  }

  const pruned = pruneWithTemplate(migratedInput, DEFAULT_SETTINGS) as Partial<AppSettings>;

  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...pruned };
  for (const key of ['gallery', 'toolbar', 'download', 'accessibility', 'features'] as const) {
    merged[key] = { ...DEFAULT_SETTINGS[key], ...(pruned[key] ?? {}) };
  }

  return { ...merged, version: DEFAULT_SETTINGS.version, lastModified: nowMs } as AppSettings;
}
