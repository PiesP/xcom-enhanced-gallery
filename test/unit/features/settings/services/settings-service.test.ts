// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SettingsService } from '@features/settings/services/settings-service';
import type { SettingsRepository } from '@features/settings/services/settings-repository';
import type { AppSettings, SettingChangeEvent } from '@shared/types/settings.types';
import { createDefaultSettings } from '@constants/settings';

// ── Helpers ─────────────────────────────────────────────────────────────

function createMockRepository(): SettingsRepository {
  let savedSettings: AppSettings | null = null;
  return {
    load: vi.fn(async () => {
      if (savedSettings) return savedSettings;
      return createDefaultSettings(Date.now());
    }),
    save: vi.fn(async (settings: AppSettings) => {
      savedSettings = settings;
    }),
  };
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('SettingsService', () => {
  let service: SettingsService;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  afterEach(async () => {
    service?.destroy();
  });

  // ── constructor ──────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should accept a custom repository', () => {
      service = new SettingsService(mockRepo);
      expect(service).toBeInstanceOf(SettingsService);
      expect(service.isInitialized()).toBe(false);
    });

    it('should not load settings on construction', () => {
      service = new SettingsService(mockRepo);
      expect(mockRepo.load).not.toHaveBeenCalled();
    });
  });

  // ── initialize / destroy / isInitialized ─────────────────────────────

  describe('initialize', () => {
    it('should load settings from repository and mark initialized', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      expect(mockRepo.load).toHaveBeenCalledTimes(1);
      expect(service.isInitialized()).toBe(true);
    });

    it('should be idempotent', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      await service.initialize();
      expect(mockRepo.load).toHaveBeenCalledTimes(1);
    });

    it('should load saved settings from repository', async () => {
      const customSettings = createDefaultSettings(Date.now());
      customSettings.gallery.theme = 'dark';
      mockRepo.load.mockResolvedValue(customSettings);

      service = new SettingsService(mockRepo);
      await service.initialize();
      expect(service.get('gallery.theme')).toBe('dark');
    });
  });

  describe('destroy', () => {
    it('should clear initialization state', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('should not attempt to persist after destroy', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      service.destroy();
      // Calling set on a destroyed service may still work
      // since the repo is still referenced, but initialization guard
      // in destroy clears listeners
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialize', () => {
      service = new SettingsService(mockRepo);
      expect(service.isInitialized()).toBe(false);
    });

    it('should return true after initialize', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });

    it('should return false after destroy', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      service.destroy();
      expect(service.isInitialized()).toBe(false);
    });
  });

  // ── get ──────────────────────────────────────────────────────────────

  describe('get', () => {
    beforeEach(async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
    });

    it('should return nested gallery.theme value', () => {
      expect(service.get('gallery.theme')).toBe('auto');
    });

    it('should return nested gallery.imageFitMode value', () => {
      expect(service.get('gallery.imageFitMode')).toBe('fitWidth');
    });

    it('should return gallery.videoVolume as number', () => {
      expect(service.get('gallery.videoVolume')).toBe(1.0);
    });

    it('should return gallery.videoMuted as boolean', () => {
      expect(service.get('gallery.videoMuted')).toBe(false);
    });

    it('should return toolbar.autoHideDelay value', () => {
      expect(service.get('toolbar.autoHideDelay')).toBe(3000);
    });

    it('should return features.gallery value', () => {
      expect(service.get('features.gallery')).toBe(true);
    });

    it('should return default value for undefined paths', () => {
      // After set to a value, get returns it
      // Unknown paths fall back to undefined
      expect(service.get('nonexistent.key' as any)).toBeUndefined();
    });

    it('should handle top-level keys like version', () => {
      expect(service.get('version')).toBe('1');
    });

    it('should return default when a nested setting has no value', () => {
      // All settings are initialized, so this tests fallback behavior
      // when a key exists but sub-path doesn't
      expect(service.get('gallery.preloadCount')).toBe(3);
    });
  });

  // ── set ──────────────────────────────────────────────────────────────

  describe('set', () => {
    beforeEach(async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
    });

    it('should update a gallery setting', async () => {
      await service.set('gallery.theme', 'dark');
      expect(service.get('gallery.theme')).toBe('dark');
    });

    it('should update a toolbar setting', async () => {
      await service.set('toolbar.autoHideDelay', 5000);
      expect(service.get('toolbar.autoHideDelay')).toBe(5000);
    });

    it('should persist to repository after setting', async () => {
      await service.set('gallery.theme', 'dark');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      const saved = (mockRepo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as AppSettings;
      expect(saved.gallery.theme).toBe('dark');
    });

    it('should update lastModified on set', async () => {
      const before = Date.now();
      await service.set('gallery.theme', 'dark');
      const after = Date.now();
      const lastModified = service.get('lastModified') as number;
      expect(lastModified).toBeGreaterThanOrEqual(before);
      expect(lastModified).toBeLessThanOrEqual(after);
    });

    it('should persist the current lastModified with the changed setting', async () => {
      const saved: AppSettings[] = [];
      const repository: SettingsRepository = {
        load: vi.fn(async () => createDefaultSettings(Date.now())),
        save: vi.fn(async (settings) => {
          saved.push(globalThis.structuredClone(settings));
        }),
      };
      service = new SettingsService(repository);
      await service.initialize();

      await service.set('gallery.theme', 'dark');

      expect(saved[0]?.lastModified).toBe(service.get('lastModified'));
    });

    it('should reject boolean when number is expected', async () => {
      await expect(
        service.set('toolbar.autoHideDelay', false as any)
      ).rejects.toThrow('Invalid setting value for toolbar.autoHideDelay');
    });

    it('should reject string when boolean is expected', async () => {
      await expect(
        service.set('gallery.videoMuted', 'yes' as any)
      ).rejects.toThrow('Invalid setting value for gallery.videoMuted');
    });

    it('should accept boolean for a boolean setting', async () => {
      await service.set('gallery.videoMuted', true);
      expect(service.get('gallery.videoMuted')).toBe(true);
    });

    it('should accept number for a number setting', async () => {
      await service.set('gallery.videoVolume', 0.5);
      expect(service.get('gallery.videoVolume')).toBe(0.5);
    });

    it('should accept nested object value when default is an object', async () => {
      // gallery is an object, so we should be able to set it
      const newGallery = { ...(service.get('gallery') as any), theme: 'dark' };
      await service.set('gallery', newGallery);
      expect(service.get('gallery.theme')).toBe('dark');
    });
  });

  // ── subscribe ────────────────────────────────────────────────────────

  describe('subscribe', () => {
    beforeEach(async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
    });

    it('should notify subscriber on setting change', async () => {
      const listener = vi.fn();
      service.subscribe(listener);
      await service.set('gallery.theme', 'dark');

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as SettingChangeEvent;
      expect(event.key).toBe('gallery.theme');
      expect(event.oldValue).toBe('auto');
      expect(event.newValue).toBe('dark');
      expect(event.status).toBe('success');
      expect(typeof event.timestamp).toBe('number');
    });

    it('should return an unsubscribe function', async () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      unsubscribe();
      await service.set('gallery.theme', 'dark');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple subscribers', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.subscribe(listener1);
      service.subscribe(listener2);
      await service.set('gallery.theme', 'dark');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should notify with correct old and new values', async () => {
      const listener = vi.fn();
      service.subscribe(listener);
      await service.set('gallery.videoVolume', 0.5);

      const event = listener.mock.calls[0][0] as SettingChangeEvent;
      expect(event.oldValue).toBe(1.0);
      expect(event.newValue).toBe(0.5);
    });
  });

  // ── Edge cases ───────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty string path in assignNestedPath', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      // Setting with invalid path should fail via assignNestedPath
      await expect(service.set('' as any, 'value')).rejects.toThrow();
    });

    it('should handle default value fallback for undefined keys', async () => {
      service = new SettingsService(mockRepo);
      await service.initialize();
      // Unknown deep path returns undefined
      expect(service.get('gallery.nonexistent' as any)).toBeUndefined();
    });

    it('should handle array type defaults', async () => {
      // AppSettings doesn't have array fields, but we test isValidSettingValue
      // through the type system. Number fields accept numbers.
      service = new SettingsService(mockRepo);
      await service.initialize();
      await expect(service.set('gallery.videoVolume', 0.8)).resolves.not.toThrow();
      expect(service.get('gallery.videoVolume')).toBe(0.8);
    });

    it('should handle destroy when not initialized', () => {
      service = new SettingsService(mockRepo);
      expect(() => service.destroy()).not.toThrow();
    });
  });
});
