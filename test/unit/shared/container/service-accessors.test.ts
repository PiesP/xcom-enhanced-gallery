import { SERVICE_KEYS } from '@/constants';
import { CoreServiceRegistry } from '@shared/container/core-service-registry';
import * as ServiceAccessors from '@shared/container/service-accessors';
import type { GalleryRenderer } from '@shared/interfaces/gallery.interfaces';

vi.mock('@shared/container/core-service-registry', () => ({
  CoreServiceRegistry: {
    get: vi.fn(),
    register: vi.fn(),
    tryGet: vi.fn(),
  },
}));

describe('ServiceAccessors', () => {
  function createMockRenderer(): GalleryRenderer {
    return {
      async render() {
        // no-op
      },
      close() {
        // no-op
      },
      destroy() {
        // no-op
      },
      isRendering() {
        return false;
      },
      setOnCloseCallback() {
        // no-op
      },
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get theme service', () => {
    const mockService = { foo: 'theme' };
    vi.mocked(CoreServiceRegistry.get).mockReturnValue(mockService);

    const result = ServiceAccessors.getThemeService();

    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.THEME);
    expect(result).toBe(mockService);
  });

  it('should get language service', () => {
    const mockService = { foo: 'language' };
    vi.mocked(CoreServiceRegistry.get).mockReturnValue(mockService);

    const result = ServiceAccessors.getLanguageService();

    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.LANGUAGE);
    expect(result).toBe(mockService);
  });

  it('should get media filename service', () => {
    const mockService = { foo: 'filename' };
    vi.mocked(CoreServiceRegistry.get).mockReturnValue(mockService);

    const result = ServiceAccessors.getMediaFilenameService();

    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.MEDIA_FILENAME);
    expect(result).toBe(mockService);
  });

  it('should get media service', () => {
    const mockService = { foo: 'media' };
    vi.mocked(CoreServiceRegistry.get).mockReturnValue(mockService);

    const result = ServiceAccessors.getMediaService();

    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.MEDIA_SERVICE);
    expect(result).toBe(mockService);
  });

  it('should get gallery renderer', () => {
    const mockRenderer = createMockRenderer();
    vi.mocked(CoreServiceRegistry.get).mockReturnValue(mockRenderer);

    const result = ServiceAccessors.getGalleryRenderer();

    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.GALLERY_RENDERER);
    expect(result).toBe(mockRenderer);
  });

  it('should register gallery renderer', () => {
    const mockRenderer = createMockRenderer();
    ServiceAccessors.registerGalleryRenderer(mockRenderer);
    expect(CoreServiceRegistry.register).toHaveBeenCalledWith(
      SERVICE_KEYS.GALLERY_RENDERER,
      mockRenderer,
    );
  });

  it('should register settings manager', () => {
    const mockSettings = { foo: 'settings' };
    ServiceAccessors.registerSettingsManager(mockSettings);
    expect(CoreServiceRegistry.register).toHaveBeenCalledWith(SERVICE_KEYS.SETTINGS, mockSettings);
  });

  it('should try get settings manager', () => {
    const mockSettings = { foo: 'settings' };
    vi.mocked(CoreServiceRegistry.tryGet).mockReturnValue(mockSettings);
    const result = ServiceAccessors.tryGetSettingsManager();
    expect(CoreServiceRegistry.tryGet).toHaveBeenCalledWith(SERVICE_KEYS.SETTINGS);
    expect(result).toBe(mockSettings);
  });

  it('should warmup critical services', () => {
    ServiceAccessors.warmupCriticalServices();
    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.MEDIA_SERVICE);
  });

  it('should handle warmup critical services error', () => {
    vi.mocked(CoreServiceRegistry.get).mockImplementation(() => {
      throw new Error('fail');
    });
    expect(() => ServiceAccessors.warmupCriticalServices()).not.toThrow();
  });

  it('should warmup non-critical services', () => {
    ServiceAccessors.warmupNonCriticalServices();
    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.THEME);
    expect(CoreServiceRegistry.get).toHaveBeenCalledWith(SERVICE_KEYS.MEDIA_FILENAME);
  });

  it('should handle warmup non-critical services error', () => {
    vi.mocked(CoreServiceRegistry.get).mockImplementation(() => {
      throw new Error('fail');
    });
    expect(() => ServiceAccessors.warmupNonCriticalServices()).not.toThrow();
  });
});
