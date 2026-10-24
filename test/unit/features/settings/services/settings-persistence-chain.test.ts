// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { PersistentSettingsRepository } from '@features/settings/services/settings-repository';
import { SettingsService } from '@features/settings/services/settings-service';
import { resetPersistentStorageForTests } from '@shared/services/persistent-storage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const backend = vi.hoisted(() => ({
  values: new Map<string, string>(),
  denyPrimary: false,
  denyFallback: false,
}));

vi.mock('@platform/index', () => ({
  getStorageAdapter: () => ({
    get: async (key: string) => backend.values.get(key),
    set: async (key: string, value: string) => {
      if (backend.denyPrimary) {
        throw new Error('primary denied');
      }
      backend.values.set(key, value);
    },
    remove: async (key: string) => {
      backend.values.delete(key);
    },
  }),
}));

describe('settings storage and service outcome', () => {
  const fallback = new Map<string, string>();
  beforeEach(() => {
    backend.values.clear();
    backend.denyPrimary = false;
    backend.denyFallback = false;
    fallback.clear();
    resetPersistentStorageForTests();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => fallback.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (backend.denyFallback) {
          throw new Error('fallback denied');
        }
        fallback.set(key, value);
      },
      removeItem: (key: string) => fallback.delete(key),
    });
  });

  afterEach(() => {
    resetPersistentStorageForTests();
    vi.unstubAllGlobals();
  });

  it('keeps the latest session value when both stores deny writes and persists it on explicit retry', async () => {
    const repository = new PersistentSettingsRepository();
    const settings = new SettingsService(repository);
    await settings.initialize();
    await settings.set('gallery.theme', 'light');
    backend.denyPrimary = true;
    backend.denyFallback = true;
    const events: string[] = [];
    settings.subscribe((event) => events.push(`${event.key}:${event.status}`));

    await expect(settings.set('gallery.theme', 'dark')).rejects.toThrow(
      'No settings storage accepted the write'
    );
    expect(settings.get('gallery.theme')).toBe('dark');
    expect(settings.hasUnsavedChanges()).toBe(true);
    expect(events).toEqual(['gallery.theme:error']);
    await expect(settings.set('gallery.videoClickMode', 'allow-all')).rejects.toThrow();
    expect(settings.get('gallery.videoClickMode')).toBe('allow-all');

    backend.denyPrimary = false;
    backend.denyFallback = false;
    await settings.retryUnsaved();
    expect(settings.hasUnsavedChanges()).toBe(false);
    const reloaded = new SettingsService(new PersistentSettingsRepository());
    await reloaded.initialize();
    expect(reloaded.get('gallery.theme')).toBe('dark');
    expect(reloaded.get('gallery.videoClickMode')).toBe('allow-all');
    settings.destroy();
    reloaded.destroy();
  });

  it('accepts a fallback write as durable and recovers the value after reload', async () => {
    const settings = new SettingsService(new PersistentSettingsRepository());
    await settings.initialize();
    backend.denyPrimary = true;
    await settings.set('gallery.theme', 'dark');
    expect(settings.hasUnsavedChanges()).toBe(false);

    backend.denyPrimary = false;
    const reloaded = new SettingsService(new PersistentSettingsRepository());
    await reloaded.initialize();
    expect(reloaded.get('gallery.theme')).toBe('dark');
    settings.destroy();
    reloaded.destroy();
  });
});
