import { SettingsService } from '@features/settings/services/settings-service';
import { APP_SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS } from '@/constants';

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

vi.mock('@features/settings/services/settings-migration', () => ({
  migrateSettings: vi.fn(settings => settings),
}));

vi.mock('@features/settings/services/settings-schema', () => ({
  computeCurrentSettingsSchemaHash: vi.fn(() => 'mock-hash'),
}));

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SettingsService();
  });

  describe('initialize', () => {
    it('should load settings from storage on initialization', async () => {
      const storedSettings = { ...DEFAULT_SETTINGS, __schemaHash: 'mock-hash' };
      mockStorage.get.mockResolvedValue(storedSettings);

      await service.initialize();

      expect(mockStorage.get).toHaveBeenCalledWith(APP_SETTINGS_STORAGE_KEY);
      expect(service.isInitialized()).toBe(true);
    });

    it('should save default settings if storage is empty', async () => {
      mockStorage.get.mockResolvedValue(null);

      await service.initialize();

      expect(mockStorage.set).toHaveBeenCalledWith(
        APP_SETTINGS_STORAGE_KEY,
        expect.objectContaining({ __schemaHash: 'mock-hash' })
      );
    });

    it('should migrate settings if schema hash differs', async () => {
      const storedSettings = { ...DEFAULT_SETTINGS, __schemaHash: 'old-hash' };
      mockStorage.get.mockResolvedValue(storedSettings);

      await service.initialize();

      // It should call saveSettings after migration
      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return default value for unknown key', () => {
      expect(service.get('gallery.autoScrollSpeed')).toBe(DEFAULT_SETTINGS.gallery.autoScrollSpeed);
    });

    it('should return stored value', async () => {
      const newValue = 10;
      await service.set('gallery.autoScrollSpeed', newValue);
      expect(service.get('gallery.autoScrollSpeed')).toBe(newValue);
    });
  });

  describe('set', () => {
    it('should update setting and notify listeners', async () => {
      const listener = vi.fn();
      service.subscribe(listener);

      await service.set('gallery.autoScrollSpeed', 20);

      expect(service.get('gallery.autoScrollSpeed')).toBe(20);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'gallery.autoScrollSpeed',
          newValue: 20,
          status: 'success',
        })
      );
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should throw error for invalid type', async () => {
      await expect(service.set('gallery.autoScrollSpeed', 'invalid')).rejects.toThrow(
        'Invalid setting value'
      );
    });
  });

  describe('updateBatch', () => {
    it('should update multiple settings', async () => {
      const updates = {
        'gallery.autoScrollSpeed': 15,
        'download.autoZip': true,
      };

      await service.updateBatch(updates);

      expect(service.get('gallery.autoScrollSpeed')).toBe(15);
      expect(service.get('download.autoZip')).toBe(true);
      expect(mockStorage.set).toHaveBeenCalled();
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings', async () => {
      await service.set('gallery.autoScrollSpeed', 99);
      await service.resetToDefaults();

      expect(service.get('gallery.autoScrollSpeed')).toBe(DEFAULT_SETTINGS.gallery.autoScrollSpeed);
    });

    it('should reset specific category', async () => {
      await service.set('gallery.autoScrollSpeed', 99);
      await service.set('download.autoZip', true);

      await service.resetToDefaults('gallery');

      expect(service.get('gallery.autoScrollSpeed')).toBe(DEFAULT_SETTINGS.gallery.autoScrollSpeed);
      expect(service.get('download.autoZip')).toBe(true); // Should remain changed
    });
  });

  describe('import/export', () => {
    it('should export settings as JSON string', () => {
      const json = service.exportSettings();
      expect(typeof json).toBe('string');
      expect(JSON.parse(json)).toBeDefined();
    });

    it('should import settings from JSON string', async () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        gallery: { ...DEFAULT_SETTINGS.gallery, autoScrollSpeed: 50 },
      };
      const json = JSON.stringify(newSettings);

      await service.importSettings(json);

      expect(service.get('gallery.autoScrollSpeed')).toBe(50);
      expect(mockStorage.set).toHaveBeenCalled();
    });

    it('should throw error for invalid JSON', async () => {
      await expect(service.importSettings('invalid-json')).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should save settings and clear listeners', async () => {
      await service.cleanup();
      expect(mockStorage.set).toHaveBeenCalled();
      expect(service.isInitialized()).toBe(false);
    });
  });
});
