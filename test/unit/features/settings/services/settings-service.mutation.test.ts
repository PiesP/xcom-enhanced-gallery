import { SettingsService } from '@features/settings/services/settings-service';
import { DEFAULT_SETTINGS } from '@/constants';

// Mock dependencies
const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: () => mockStorage,
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// We need to access the private methods or test them through public interface
// Since they are not exported, we test through public methods but with specific scenarios

describe('SettingsService Mutation Tests', () => {
  let service: SettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettingsService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cloneDeep fallback', () => {
    it('should use JSON fallback when structuredClone is not available', () => {
      const originalStructuredClone = global.structuredClone;
      // @ts-expect-error
      global.structuredClone = undefined;

      // We can access cloneDeep indirectly via getAllSettings
      // But getAllSettings uses this.settings which is private.
      // However, resetToDefaults uses cloneDeep internally.

      // Let's use a trick to access the private method if possible, or just rely on behavior.
      // getAllSettings calls cloneDeep(this.settings)
      const settings = service.getAllSettings();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lastModified, ...settingsWithoutTime } = settings;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { lastModified: _, ...defaultsWithoutTime } = DEFAULT_SETTINGS;

      expect(settingsWithoutTime).toEqual(expect.objectContaining(defaultsWithoutTime));
      // @ts-ignore
      expect(settings).not.toBe(service['settings']); // Should be a copy

      // Restore
      global.structuredClone = originalStructuredClone;
    });
  });

  describe('resolveNestedValue (via get)', () => {
    it('should handle intermediate non-object values gracefully', async () => {
      // Setup: set 'gallery.autoScrollSpeed' to a number (default)
      // Then try to access 'gallery.autoScrollSpeed.nested'
      // resolveNestedValue should return undefined, and get should return default value (undefined)

      const val = service.get('gallery.autoScrollSpeed.nested');
      expect(val).toBeUndefined();
    });

    it('should handle null intermediate values', async () => {
      // Force a null into settings for testing purposes
      // @ts-ignore
      service.settings.gallery = null;

      const val = service.get('gallery.autoScrollSpeed');
      // Should return default value because resolveNestedValue returns undefined
      expect(val).toBe(DEFAULT_SETTINGS.gallery.autoScrollSpeed);
    });
  });

  describe('assignNestedValue (via set)', () => {
    it('should create nested objects when they do not exist', async () => {
      // @ts-ignore
      await service.set('newCategory.newSetting', 'value');
      // @ts-ignore
      expect(service.get('newCategory.newSetting')).toBe('value');
    });

    it('should overwrite non-object intermediate values with objects', async () => {
      // First set a value
      // @ts-ignore
      await service.set('a.b', 'value');
      // Now try to set a.b.c, which requires a.b to be an object, but it is a string
      // The implementation: if (!current[key] || typeof current[key] !== 'object') current[key] = {};
      // So 'a.b' should become an object
      // @ts-ignore
      await service.set('a.b.c', 'nested');

      // @ts-ignore
      expect(service.get('a.b.c')).toBe('nested');
      // @ts-ignore
      const ab = service.get('a.b');
      expect(typeof ab).toBe('object');
    });

    it('should handle empty keys in path (skip them)', async () => {
      // Path with empty string: 'a..b' -> ['a', '', 'b']
      // The implementation: if (!key) continue;
      // So it should treat it as 'a.b' effectively?
      // Wait:
      // for (let i = 0; i < keys.length - 1; i++) { const key = keys[i]; if (!key) continue; ... }
      // If keys=['a', '', 'b'], loop goes 0, 1.
      // i=0: key='a'. current becomes current['a']
      // i=1: key=''. continue. current stays current['a']
      // lastKey = 'b'. current['b'] = value.
      // So 'a..b' acts like 'a.b'

      // We can't easily pass 'a..b' to set because it splits by '.'
      // 'a..b'.split('.') -> ['a', '', 'b']

      // @ts-ignore
      await service.set('test..nested', 'value');
      // @ts-ignore
      expect(service.get('test.nested')).toBe('value');
    });
  });

  describe('isValid', () => {
    it('should allow setting keys that do not exist in defaults', async () => {
      // isValid returns true if getDefaultValue returns undefined
      // @ts-expect-error
      await expect(service.set('nonExistentKey', 'value')).resolves.not.toThrow();
    });

    it('should validate array types', async () => {
      // Assuming there is an array setting in DEFAULT_SETTINGS.
      // Let's check DEFAULT_SETTINGS structure or mock it.
      // If no array setting exists, we can't test this path easily without mocking getDefaultValue.
      // But we can mock getDefaultValue on the instance.

      // @ts-expect-error
      vi.spyOn(service, 'getDefaultValue').mockReturnValue(['a', 'b']);

      // @ts-expect-error
      await expect(service.set('mockArray', 'not-an-array')).rejects.toThrow(
        'Invalid setting value'
      );
      // @ts-expect-error
      await expect(service.set('mockArray', ['c'])).resolves.not.toThrow();
    });

    it('should validate object types', async () => {
      // @ts-expect-error
      vi.spyOn(service, 'getDefaultValue').mockReturnValue({ a: 1 });

      // @ts-expect-error
      await expect(service.set('mockObject', null)).rejects.toThrow('Invalid setting value');
      // @ts-expect-error
      await expect(service.set('mockObject', 'string')).rejects.toThrow('Invalid setting value');
      // @ts-expect-error
      await expect(service.set('mockObject', { b: 2 })).resolves.not.toThrow();
    });
  });

  describe('notifyListeners error handling', () => {
    it('should catch errors thrown by listeners', async () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener failed');
      });
      const successListener = vi.fn();

      service.subscribe(errorListener);
      service.subscribe(successListener);

      await service.set('gallery.autoScrollSpeed', 25);

      expect(errorListener).toHaveBeenCalled();
      expect(successListener).toHaveBeenCalled(); // Should still be called
    });
  });

  describe('Storage Error Handling', () => {
    it('should handle storage read errors gracefully', async () => {
      mockStorage.get.mockRejectedValue(new Error('Read error'));

      // Should not throw
      await service.initialize();

      // Should have logged error
      const { logger } = await import('@shared/logging');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Settings load failed'),
        expect.any(Error)
      );
    });

    it('should handle storage write errors gracefully', async () => {
      mockStorage.set.mockRejectedValue(new Error('Write error'));

      // Should not throw
      await service.set('gallery.autoScrollSpeed', 30);

      // Should have logged error
      const { logger } = await import('@shared/logging');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Settings save failed'),
        expect.any(Error)
      );
    });
  });
});
