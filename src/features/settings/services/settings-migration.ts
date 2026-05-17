import { DEFAULT_SETTINGS } from '@constants/settings';
import type { AppSettings } from '@shared/types/settings.types';
import { isRecord } from '@shared/utils/types/guards';

function pruneWithTemplate<T extends Record<string, unknown>>(
  input: unknown,
  template: T
): Partial<T> {
  if (!isRecord(input)) return {} as Partial<T>;

  const out: Record<string, unknown> = {};
  for (const key of Object.keys(template) as Array<keyof T>) {
    const tplVal = template[key];
    const inVal = input[key as string];
    if (inVal === undefined) continue;

    if (isRecord(tplVal) && !Array.isArray(tplVal)) {
      out[key as string] = pruneWithTemplate(inVal, tplVal);
    } else {
      out[key as string] = inVal;
    }
  }
  return out as Partial<T>;
}

export function migrateSettings(input: AppSettings, nowMs: number): AppSettings {
  const pruned = pruneWithTemplate(input, DEFAULT_SETTINGS) as Partial<AppSettings>;

  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS, ...pruned };
  for (const key of ['gallery', 'toolbar', 'download', 'accessibility', 'features'] as const) {
    merged[key] = { ...DEFAULT_SETTINGS[key], ...(pruned[key] ?? {}) };
  }

  return { ...merged, version: DEFAULT_SETTINGS.version, lastModified: nowMs } as AppSettings;
}
