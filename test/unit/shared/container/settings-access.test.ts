import { getSetting, setSetting, tryGetSettingsService } from '@shared/container/settings-access';
import * as ServiceAccessors from '@shared/container/service-accessors';

// Mock the service accessors module
vi.mock('@shared/container/service-accessors', () => ({
  tryGetSettingsManager: vi.fn(),
}));

describe('settings-access', () => {
  const mockSettingsService = {
    get: vi.fn(),
    set: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should throw error if settings service is not registered', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(null);

      expect(() => getSetting('some-key', 'default')).toThrow(
        'SettingsService is not registered. Ensure bootstrap registers it before usage.'
      );
    });

    it('should return value from settings service if defined', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(mockSettingsService);
      mockSettingsService.get.mockReturnValue('stored-value');

      const result = getSetting('some-key', 'default');

      expect(ServiceAccessors.tryGetSettingsManager).toHaveBeenCalled();
      expect(mockSettingsService.get).toHaveBeenCalledWith('some-key');
      expect(result).toBe('stored-value');
    });

    it('should return fallback value if settings service returns undefined', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(mockSettingsService);
      mockSettingsService.get.mockReturnValue(undefined);

      const result = getSetting('some-key', 'default');

      expect(mockSettingsService.get).toHaveBeenCalledWith('some-key');
      expect(result).toBe('default');
    });
  });

  describe('setSetting', () => {
    it('should throw error if settings service is not registered', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(null);

      expect(() => setSetting('some-key', 'value')).toThrow(
        'SettingsService is not registered. Ensure bootstrap registers it before usage.'
      );
    });

    it('should call set on settings service', async () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(mockSettingsService);
      mockSettingsService.set.mockResolvedValue(undefined);

      await setSetting('some-key', 'value');

      expect(ServiceAccessors.tryGetSettingsManager).toHaveBeenCalled();
      expect(mockSettingsService.set).toHaveBeenCalledWith('some-key', 'value');
    });
  });

  describe('tryGetSettingsService', () => {
    it('should return null if service is not registered', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(null);

      const result = tryGetSettingsService();

      expect(result).toBeNull();
    });

    it('should return service if registered', () => {
      vi.mocked(ServiceAccessors.tryGetSettingsManager).mockReturnValue(mockSettingsService);

      const result = tryGetSettingsService();

      expect(result).toBe(mockSettingsService);
    });
  });
});
