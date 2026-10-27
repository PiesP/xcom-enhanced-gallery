// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { PersistentSettingsRepository } from '@features/settings/services/settings-repository';
import { SettingsService } from '@features/settings/services/settings-service';
import { createDefaultSettings } from '@constants/settings';
import { resetPersistentStorageForTests } from '@shared/services/persistent-storage';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const backend = vi.hoisted(() => ({
  values: new Map<string, string>(),
  denyPrimary: false,
  denyFallback: false,
  deniedReads: 0,
  denyReads: false,
  denyFallbackReads: false,
  beforeSet: null as ((key: string, value: string) => Promise<void>) | null,
  rejectSet: null as ((key: string, value: string) => boolean) | null,
}));

vi.mock('@platform/index', () => ({
  getStorageAdapter: () => ({
    get: async (key: string) => {
      if (backend.denyReads || backend.deniedReads > 0) {
        backend.deniedReads = Math.max(0, backend.deniedReads - 1);
        throw new Error('primary read denied');
      }
      return backend.values.get(key);
    },
    set: async (key: string, value: string) => {
      await backend.beforeSet?.(key, value);
      if (backend.denyPrimary || backend.rejectSet?.(key, value)) {
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
    backend.deniedReads = 0;
    backend.denyReads = false;
    backend.denyFallbackReads = false;
    backend.beforeSet = null;
    backend.rejectSet = null;
    fallback.clear();
    resetPersistentStorageForTests();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => {
        if (backend.denyFallbackReads && key.startsWith('xeg-fallback:')) {
          throw new Error('fallback read denied');
        }
        return fallback.get(key) ?? null;
      },
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
    vi.restoreAllMocks();
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

  it('preserves independent field edits made by separately initialized documents', async () => {
    const a = new SettingsService(new PersistentSettingsRepository());
    const b = new SettingsService(new PersistentSettingsRepository());
    await Promise.all([a.initialize(), b.initialize()]);

    await a.set('gallery.theme', 'dark');
    await b.set('gallery.videoVolume', 0.25);

    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('persists only changed leaves when a caller sets a stale gallery object', async () => {
    const a = new SettingsService(new PersistentSettingsRepository());
    const b = new SettingsService(new PersistentSettingsRepository());
    await Promise.all([a.initialize(), b.initialize()]);
    await a.set('gallery.theme', 'dark');
    await b.set('gallery', {
      ...(b.get('gallery') as Record<string, unknown>),
      videoVolume: 0.25,
    });
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('preserves unrelated overlapping edits across independent storage queues', async () => {
    const a = new SettingsService(new PersistentSettingsRepository());
    resetPersistentStorageForTests();
    const b = new SettingsService(new PersistentSettingsRepository());
    await Promise.all([a.initialize(), b.initialize()]);
    let releaseTheme: () => void = () => undefined;
    let themeStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      themeStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseTheme = resolve;
    });
    backend.beforeSet = async (key) => {
      if (key.endsWith(':field:gallery.theme')) {
        themeStarted();
        await gate;
      }
    };
    const theme = a.set('gallery.theme', 'dark');
    await started;
    await b.set('gallery.videoVolume', 0.25);
    releaseTheme();
    await theme;
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('uses the last accepted same-field value across overlapping documents', async () => {
    const a = new SettingsService(new PersistentSettingsRepository());
    resetPersistentStorageForTests();
    const b = new SettingsService(new PersistentSettingsRepository());
    await Promise.all([a.initialize(), b.initialize()]);
    let releaseDark: () => void = () => undefined;
    let darkStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      darkStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseDark = resolve;
    });
    backend.beforeSet = async (key, value) => {
      if (key.endsWith(':field:gallery.theme') && value.includes('"dark"')) {
        darkStarted();
        await gate;
      }
    };
    const dark = a.set('gallery.theme', 'dark');
    await started;
    await b.set('gallery.theme', 'light');
    releaseDark();
    await dark;
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('reports a fallback write as unsaved when a primary timestamp tie hides it', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
    const a = new SettingsService(new PersistentSettingsRepository());
    resetPersistentStorageForTests();
    const b = new SettingsService(new PersistentSettingsRepository());
    await Promise.all([a.initialize(), b.initialize()]);
    let releaseLight: () => void = () => undefined;
    let lightStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      lightStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseLight = resolve;
    });
    backend.beforeSet = async (key, value) => {
      if (key.endsWith(':field:gallery.theme') && value.includes('"light"')) {
        lightStarted();
        await gate;
      }
    };
    backend.rejectSet = (key, value) =>
      key.endsWith(':field:gallery.theme') && value.includes('"light"');
    const light = b.set('gallery.theme', 'light');
    await started;
    await a.set('gallery.theme', 'dark');
    releaseLight();
    await expect(light).rejects.toThrow('could not be confirmed');
    expect(b.hasUnsavedChanges()).toBe(true);
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('keeps a failed initial read unavailable until intent can merge with recovered storage', async () => {
    const saved = createDefaultSettings(1_000);
    saved.gallery.theme = 'dark';
    saved.gallery.imageFitMode = 'fitHeight';
    saved.gallery.videoVolume = 0.8;
    backend.values.set(
      'xeg-app-settings',
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: { ...saved, __schemaHash: '1' },
      })
    );
    backend.deniedReads = 1;
    const service = new SettingsService(new PersistentSettingsRepository());
    await service.initialize();
    expect(service.hasUnsavedChanges()).toBe(true);
    await service.set('gallery.videoVolume', 0.25);

    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.imageFitMode')).toBe('fitHeight');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    service.destroy();
    fresh.destroy();
  });

  it('does not write defaults while storage remains unreadable, then retries explicit intent', async () => {
    const saved = createDefaultSettings(1_000);
    saved.gallery.theme = 'dark';
    backend.values.set(
      'xeg-app-settings',
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: { ...saved, __schemaHash: '1' },
      })
    );
    backend.denyReads = true;
    const service = new SettingsService(new PersistentSettingsRepository());
    await service.initialize();
    await expect(service.set('gallery.videoVolume', 0.25)).rejects.toThrow();
    expect(service.hasUnsavedChanges()).toBe(true);
    expect(backend.values.size).toBe(1);
    backend.denyReads = false;
    await service.retryUnsaved();
    expect(service.hasUnsavedChanges()).toBe(false);
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    service.destroy();
    fresh.destroy();
  });

  it('retains pending edits across restart and merges a remote unrelated edit on retry', async () => {
    const a = new SettingsService(new PersistentSettingsRepository());
    backend.denyReads = true;
    await a.initialize();
    await expect(a.set('gallery.theme', 'dark')).rejects.toThrow();
    await a.prepareForRestart();
    backend.denyReads = false;
    resetPersistentStorageForTests();
    const b = new SettingsService(new PersistentSettingsRepository());
    await b.initialize();
    await b.set('gallery.videoVolume', 0.25);
    await a.initialize();
    expect(a.hasUnsavedChanges()).toBe(true);
    await a.retryUnsaved();
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    a.destroy();
    b.destroy();
    fresh.destroy();
  });

  it('does not write when the fallback read becomes unavailable', async () => {
    const saved = createDefaultSettings(1_000);
    saved.gallery.theme = 'dark';
    backend.values.set(
      'xeg-app-settings',
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: { ...saved, __schemaHash: '1' },
      })
    );
    const settings = new SettingsService(new PersistentSettingsRepository());
    await settings.initialize();
    backend.denyFallbackReads = true;
    await expect(settings.set('gallery.videoVolume', 0.25)).rejects.toThrow('unreadable');
    expect(settings.hasUnsavedChanges()).toBe(true);
    expect(backend.values.size).toBe(1);
    backend.denyFallbackReads = false;
    await settings.retryUnsaved();
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    settings.destroy();
    fresh.destroy();
  });

  it('keeps a recovered edit pending when the subsequent write fails', async () => {
    const saved = createDefaultSettings(1_000);
    saved.gallery.theme = 'dark';
    backend.values.set(
      'xeg-app-settings',
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: { ...saved, __schemaHash: '1' },
      })
    );
    backend.deniedReads = 1;
    const settings = new SettingsService(new PersistentSettingsRepository());
    await settings.initialize();
    backend.denyPrimary = true;
    backend.denyFallback = true;
    await expect(settings.set('gallery.videoVolume', 0.25)).rejects.toThrow();
    expect(settings.hasUnsavedChanges()).toBe(true);
    expect(backend.values.size).toBe(1);
    backend.denyPrimary = false;
    backend.denyFallback = false;
    await settings.retryUnsaved();
    const fresh = new SettingsService(new PersistentSettingsRepository());
    await fresh.initialize();
    expect(fresh.get('gallery.theme')).toBe('dark');
    expect(fresh.get('gallery.videoVolume')).toBe(0.25);
    settings.destroy();
    fresh.destroy();
  });

  it('recovers a no-edit unavailable baseline without writing and notifies subscribers', async () => {
    const saved = createDefaultSettings(1_000);
    saved.gallery.theme = 'dark';
    backend.values.set(
      'xeg-app-settings',
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: { ...saved, __schemaHash: '1' },
      })
    );
    backend.deniedReads = 1;
    const settings = new SettingsService(new PersistentSettingsRepository());
    await settings.initialize();
    expect(settings.hasUnsavedChanges()).toBe(true);
    const events: string[] = [];
    settings.subscribe((event) => events.push(`${event.key}:${event.newValue}`));
    await settings.retryUnsaved();
    expect(settings.hasUnsavedChanges()).toBe(false);
    expect(settings.get('gallery.theme')).toBe('dark');
    expect(events).toContain('gallery.theme:dark');
    expect(backend.values.size).toBe(1);
    settings.destroy();
  });
});
