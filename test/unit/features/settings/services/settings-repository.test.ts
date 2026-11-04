// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DEFAULT_SETTINGS } from '@constants/settings';
import { PersistentSettingsRepository } from '@features/settings/services/settings-repository';
import { SettingsService } from '@features/settings/services/settings-service';
import { resolveNestedPath } from '@shared/utils/object/path';
import {
  normalizeStoredSettings,
  SETTINGS_LEAF_KEYS,
  validateSettingValue,
} from '@features/settings/services/settings-validation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

const alternateValues: Record<(typeof SETTINGS_LEAF_KEYS)[number], unknown> = {
  'gallery.preloadCount': 100,
  'gallery.imageFitMode': 'fitHeight',
  'gallery.theme': 'dark',
  'gallery.animations': false,
  'gallery.enableKeyboardNav': false,
  'gallery.videoVolume': 0.5,
  'gallery.videoMuted': true,
  'gallery.videoClickMode': 'allow-all',
  'toolbar.autoHideDelay': 60_000,
  'features.gallery': false,
  'features.settings': false,
  'features.download': false,
  'features.mediaExtraction': false,
  'features.accessibility': false,
};

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    getState: async (key: string) => ({
      value: await mockStorageGet(key),
      available: true,
    }),
    set: mockStorageSet,
  }),
}));

describe('PersistentSettingsRepository', () => {
  it('covers every mutable leaf in the settings schema', () => {
    const leaves = Object.entries(DEFAULT_SETTINGS).flatMap(([group, value]) =>
      typeof value === 'object' && value !== null
        ? Object.keys(value).map((name) => `${group}.${name}`)
        : []
    );
    expect([...SETTINGS_LEAF_KEYS].sort()).toEqual(leaves.sort());
    for (const key of leaves) {
      const [group, name] = key.split('.') as ['gallery' | 'toolbar' | 'features', string];
      const defaultValue = (DEFAULT_SETTINGS[group] as Record<string, unknown>)[name];
      expect(validateSettingValue(key, defaultValue), key).toBe(true);
    }
  });

  beforeEach(() => {
    mockStorageGet.mockReset();
    mockStorageSet.mockReset().mockResolvedValue(undefined);
    vi.spyOn(Date, 'now').mockReturnValue(12_345);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes malformed values after migration', async () => {
    mockStorageGet.mockResolvedValue({
      __schemaHash: '1',
      ...DEFAULT_SETTINGS,
      gallery: {
        ...DEFAULT_SETTINGS.gallery,
        preloadCount: 'many',
        imageFitMode: 'stretch',
        theme: 'sepia',
        animations: 'yes',
        videoVolume: Number.NaN,
        videoMuted: 'no',
        videoClickMode: 'sometimes',
      },
      toolbar: {
        autoHideDelay: Number.POSITIVE_INFINITY,
      },
      features: {
        ...DEFAULT_SETTINGS.features,
        settings: 'enabled',
      },
    });

    const result = await new PersistentSettingsRepository().load();

    expect(result.gallery).toEqual(DEFAULT_SETTINGS.gallery);
    expect(result.toolbar.autoHideDelay).toBe(DEFAULT_SETTINGS.toolbar.autoHideDelay);
    expect(result.features.settings).toBe(DEFAULT_SETTINGS.features.settings);
    expect(result.lastModified).toBe(12_345);
  });

  it('self-heals malformed values stored with the current schema', async () => {
    mockStorageGet.mockResolvedValue({
      __schemaHash: '1',
      ...DEFAULT_SETTINGS,
      gallery: {
        ...DEFAULT_SETTINGS.gallery,
        preloadCount: 'many',
      },
    });

    const result = await new PersistentSettingsRepository().load();

    expect(mockStorageSet).toHaveBeenCalledWith('xeg-app-settings', {
      ...result,
      __schemaHash: '1',
    });
  });

  it('normalizes out-of-range values and preserves a migrated legacy enum', async () => {
    const stored = {
      ...DEFAULT_SETTINGS,
      gallery: {
        ...DEFAULT_SETTINGS.gallery,
        preloadCount: 101,
        videoVolume: 2,
        blockVideoControlClick: false,
      },
      toolbar: {
        autoHideDelay: -1,
      },
    };
    Reflect.deleteProperty(stored.gallery, 'videoClickMode');
    mockStorageGet.mockResolvedValue(stored);

    const result = await new PersistentSettingsRepository().load();

    expect(result.gallery.preloadCount).toBe(100);
    expect(result.gallery.videoVolume).toBe(DEFAULT_SETTINGS.gallery.videoVolume);
    expect(result.gallery.videoClickMode).toBe('allow-all');
    expect(result.toolbar.autoHideDelay).toBe(DEFAULT_SETTINGS.toolbar.autoHideDelay);
  });

  it('round-trips every persisted leaf as an explicit field without writing metadata or empty groups', async () => {
    const storedValues = new Map<string, unknown>();
    mockStorageGet.mockImplementation(async (key: string) => storedValues.get(key));
    mockStorageSet.mockImplementation(async (key: string, value: unknown) => {
      storedValues.set(key, value);
    });

    const repository = new PersistentSettingsRepository();
    for (const key of SETTINGS_LEAF_KEYS) {
      const value = alternateValues[key];
      expect(validateSettingValue(key, value), key).toBe(true);
      await repository.saveChanges(new Map([[key, value]]), 12_345);
    }

    const reloaded = await new PersistentSettingsRepository().load();
    for (const key of SETTINGS_LEAF_KEYS) {
      expect(resolveNestedPath(reloaded, key), key).toBe(alternateValues[key]);
    }
    expect(reloaded.download).toEqual({});
    expect(reloaded.accessibility).toEqual({});
    expect(mockStorageSet.mock.calls.map(([key]) => key)).toEqual(
      SETTINGS_LEAF_KEYS.map((key) => `xeg-app-settings:field:${key}`)
    );
    for (const excluded of ['version', 'lastModified', 'download', 'accessibility']) {
      await expect(
        repository.saveChanges(new Map([[excluded, 'changed']]), 12_345)
      ).rejects.toThrow(`Invalid setting value for ${excluded}`);
    }
  });

  it('persists only changed leaves from a group edit', async () => {
    const storedValues = new Map<string, unknown>();
    mockStorageGet.mockImplementation(async (key: string) => storedValues.get(key));
    mockStorageSet.mockImplementation(async (key: string, value: unknown) => {
      storedValues.set(key, value);
    });

    const service = new SettingsService(new PersistentSettingsRepository());
    await service.initialize();
    await service.set('gallery', { ...DEFAULT_SETTINGS.gallery, theme: 'dark', animations: false });
    await service.set('download', {});

    expect(mockStorageSet.mock.calls.map(([key]) => key)).toEqual([
      'xeg-app-settings:field:gallery.theme',
      'xeg-app-settings:field:gallery.animations',
    ]);
    const reloaded = await new PersistentSettingsRepository().load();
    expect(reloaded.gallery).toEqual({
      ...DEFAULT_SETTINGS.gallery,
      theme: 'dark',
      animations: false,
    });
    expect(reloaded.download).toEqual({});
  });

  it.each([
    ['gallery.preloadCount', 'gallery', 'preloadCount', 100, 101, 3],
    ['toolbar.autoHideDelay', 'toolbar', 'autoHideDelay', 60_000, 60_001, 3000],
  ] as const)(
    'keeps stored clamping separate from write validation for %s',
    async (key, group, name, max, overMax, fallback) => {
      const repository = new PersistentSettingsRepository();
      expect(validateSettingValue(key, max)).toBe(true);
      expect(validateSettingValue(key, overMax)).toBe(false);
      await expect(repository.saveChanges(new Map([[key, overMax]]), 1)).rejects.toThrow(
        `Invalid setting value for ${key}`
      );
      expect(
        resolveNestedPath(normalizeStoredSettings({ [group]: { [name]: overMax } }, 1), key)
      ).toBe(max);
      for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        expect(validateSettingValue(key, invalid)).toBe(false);
        await expect(repository.saveChanges(new Map([[key, invalid]]), 1)).rejects.toThrow(
          `Invalid setting value for ${key}`
        );
        expect(
          resolveNestedPath(normalizeStoredSettings({ [group]: { [name]: invalid } }, 1), key)
        ).toBe(fallback);
      }
    }
  );
});
