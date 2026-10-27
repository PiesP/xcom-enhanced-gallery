// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { DEFAULT_SETTINGS } from '@constants/settings';
import { PersistentSettingsRepository } from '@features/settings/services/settings-repository';
import { SETTINGS_LEAF_KEYS } from '@features/settings/services/settings-validation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => ({
    getState: async (key: string) => ({
      value: key === 'xeg-app-settings' ? await mockStorageGet(key) : undefined,
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
});
