import { migrateSettings, __private } from '@features/settings/services/settings-migration';
import { DEFAULT_SETTINGS } from '@/constants';
import type { AppSettings } from '@features/settings/types/settings.types';

describe('Settings Migration Service', () => {
  const { pruneWithTemplate, fillWithDefaults } = __private;

  describe('pruneWithTemplate', () => {
    it('should return empty object for non-record input', () => {
      expect(pruneWithTemplate(null, {})).toEqual({});
      expect(pruneWithTemplate(undefined, {})).toEqual({});
      expect(pruneWithTemplate('string', {})).toEqual({});
    });

    it('should keep keys present in template', () => {
      const input = { a: 1, b: 2 };
      const template = { a: 0, b: 0 };
      expect(pruneWithTemplate(input, template)).toEqual({ a: 1, b: 2 });
    });

    it('should remove keys not in template', () => {
      const input = { a: 1, c: 3 };
      const template = { a: 0, b: 0 };
      expect(pruneWithTemplate(input, template)).toEqual({ a: 1 });
    });

    it('should handle nested objects', () => {
      const input = {
        nested: { x: 1, y: 2, z: 3 },
        other: 'val'
      };
      const template = {
        nested: { x: 0, y: 0 },
        other: ''
      };
      expect(pruneWithTemplate(input, template)).toEqual({
        nested: { x: 1, y: 2 },
        other: 'val'
      });
    });

    it('should handle missing nested objects in input', () => {
      const input = { other: 'val' };
      const template = {
        nested: { x: 0 },
        other: ''
      };
      expect(pruneWithTemplate(input, template)).toEqual({ other: 'val' });
    });
  });

  describe('fillWithDefaults', () => {
    it('should fill missing top-level keys with defaults', () => {
      const input = { version: '0.0.0' } as AppSettings;
      const result = fillWithDefaults(input);

      expect(result.gallery).toEqual(DEFAULT_SETTINGS.gallery);
      expect(result.toolbar).toEqual(DEFAULT_SETTINGS.toolbar);
      expect(result.download).toEqual(DEFAULT_SETTINGS.download);
    });

    it('should preserve existing valid values', () => {
      const input = {
        ...DEFAULT_SETTINGS,
        gallery: { ...DEFAULT_SETTINGS.gallery, infiniteScroll: !DEFAULT_SETTINGS.gallery.infiniteScroll }
      };
      const result = fillWithDefaults(input);
      expect(result.gallery.infiniteScroll).toBe(input.gallery.infiniteScroll);
    });

    it('should prune unknown keys while filling defaults', () => {
      const input = {
        ...DEFAULT_SETTINGS,
        unknownKey: 'should be removed',
        gallery: {
          ...DEFAULT_SETTINGS.gallery,
          unknownGalleryKey: 'should be removed'
        }
      } as unknown as AppSettings;

      const result = fillWithDefaults(input);
      expect((result as any).unknownKey).toBeUndefined();
      expect((result.gallery as any).unknownGalleryKey).toBeUndefined();
    });

    it('should update version to current default version', () => {
      const input = { ...DEFAULT_SETTINGS, version: '0.0.0' };
      const result = fillWithDefaults(input);
      expect(result.version).toBe(DEFAULT_SETTINGS.version);
    });

    it('should update lastModified', () => {
      const input = { ...DEFAULT_SETTINGS, lastModified: 1000 };
      const result = fillWithDefaults(input);
      expect(result.lastModified).toBeGreaterThan(1000);
    });
  });

  describe('migrateSettings', () => {
    it('should return a valid settings object from partial input', () => {
      const input = { version: '0.0.0' } as AppSettings;
      const result = migrateSettings(input);

      // Should have all required keys
      expect(result).toHaveProperty('gallery');
      expect(result).toHaveProperty('toolbar');
      expect(result).toHaveProperty('download');
      expect(result.version).toBe(DEFAULT_SETTINGS.version);
    });

    it('should handle empty input', () => {
      const result = migrateSettings({} as AppSettings);
      expect(result.version).toBe(DEFAULT_SETTINGS.version);
    });

    it('should enable keyboard navigation when migrating from version 1.0.0', () => {
      const legacySettings = {
        ...DEFAULT_SETTINGS,
        version: '1.0.0',
        gallery: {
          ...DEFAULT_SETTINGS.gallery,
          enableKeyboardNav: false,
        },
      } as AppSettings;

      const result = migrateSettings(legacySettings);

      expect(result.gallery.enableKeyboardNav).toBe(true);
      expect(result.version).toBe(DEFAULT_SETTINGS.version);
    });

    it('should behave like fillWithDefaults for current version', () => {
      const input = { ...DEFAULT_SETTINGS };
      const result = migrateSettings(input);
      const expected = fillWithDefaults(input);

      const { lastModified: rTime, ...rRest } = result;
      const { lastModified: eTime, ...eRest } = expected;

      expect(rRest).toEqual(eRest);
    });
  });
});
