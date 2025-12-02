import { initializeGalleryApp } from '@/bootstrap/gallery-init';
import { registerGalleryRenderer, registerSettingsManager } from '@shared/container';
import { bootstrapErrorReporter, galleryErrorReporter, settingsErrorReporter } from '@shared/error';
import { isGMAPIAvailable } from '@shared/external/userscript';
import { logger } from '@shared/logging';

// Mock dependencies
vi.mock('@shared/container', () => ({
  registerGalleryRenderer: vi.fn(),
  registerSettingsManager: vi.fn(),
}));

vi.mock('@shared/external/userscript', () => ({
  isGMAPIAvailable: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/error', () => ({
  bootstrapErrorReporter: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), critical: vi.fn() },
  galleryErrorReporter: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), critical: vi.fn() },
  settingsErrorReporter: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), critical: vi.fn() },
}));

// Mock dynamic imports
const mockGalleryRendererInstance = {};
const mockGalleryRendererClass = vi.fn().mockImplementation(function() { return mockGalleryRendererInstance; });

const mockSettingsServiceInstance = {
  initialize: vi.fn().mockResolvedValue(undefined),
};
const mockSettingsServiceClass = vi.fn().mockImplementation(function() { return mockSettingsServiceInstance; });

const mockGalleryAppInstance = {
  initialize: vi.fn().mockResolvedValue(undefined),
};
const mockGalleryAppClass = vi.fn().mockImplementation(function() { return mockGalleryAppInstance; });

const mockThemeService = {
  isInitialized: vi.fn().mockReturnValue(false),
  initialize: vi.fn().mockResolvedValue(undefined),
  bindSettingsService: vi.fn(),
  getCurrentTheme: vi.fn().mockReturnValue('dark'),
  setTheme: vi.fn(),
};

vi.mock('@features/gallery/GalleryRenderer', () => ({
  GalleryRenderer: mockGalleryRendererClass,
}));

vi.mock('@features/settings/services/settings-service', () => ({
  SettingsService: mockSettingsServiceClass,
}));

vi.mock('@features/gallery/GalleryApp', () => ({
  GalleryApp: mockGalleryAppClass,
}));

vi.mock('@shared/container/service-accessors', () => ({
  getThemeService: vi.fn().mockReturnValue(mockThemeService),
}));

describe('gallery-init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default behavior
    vi.mocked(isGMAPIAvailable).mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should initialize gallery app successfully', async () => {
    const app = await initializeGalleryApp();

    // Verify Renderer Registration
    expect(mockGalleryRendererClass).toHaveBeenCalled();
    expect(registerGalleryRenderer).toHaveBeenCalledWith(mockGalleryRendererInstance);

    // Verify Settings Service Initialization
    expect(mockSettingsServiceClass).toHaveBeenCalled();
    expect(mockSettingsServiceInstance.initialize).toHaveBeenCalled();
    expect(registerSettingsManager).toHaveBeenCalledWith(mockSettingsServiceInstance);

    // Verify Theme Service Initialization
    expect(mockThemeService.initialize).toHaveBeenCalled();
    expect(mockThemeService.bindSettingsService).toHaveBeenCalledWith(mockSettingsServiceInstance);
    expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark', { force: true, persist: false });

    // Verify Gallery App Initialization
    expect(mockGalleryAppClass).toHaveBeenCalled();
    expect(mockGalleryAppInstance.initialize).toHaveBeenCalled();
    expect(app).toBe(mockGalleryAppInstance);

    expect(logger.info).toHaveBeenCalledWith('✅ Gallery app initialization complete');
  });

  it('should warn if GM APIs are limited', async () => {
    vi.mocked(isGMAPIAvailable).mockReturnValue(false);

    await initializeGalleryApp();

    expect(vi.mocked(bootstrapErrorReporter.warn)).toHaveBeenCalledWith(
      expect.any(Error),
      { code: 'GM_API_LIMITED' }
    );
  });

  it('should handle SettingsService initialization failure', async () => {
    const error = new Error('Settings init failed');
    mockSettingsServiceInstance.initialize.mockRejectedValueOnce(error);

    await initializeGalleryApp();

    expect(vi.mocked(settingsErrorReporter.warn)).toHaveBeenCalledWith(
      error,
      { code: 'SETTINGS_SERVICE_INIT_FAILED' }
    );
    // Should still proceed to initialize gallery app
    expect(mockGalleryAppClass).toHaveBeenCalled();
  });

  it('should handle ThemeService initialization failure', async () => {
    const error = new Error('Theme init failed');
    mockThemeService.initialize.mockRejectedValueOnce(error);

    await initializeGalleryApp();

    expect(vi.mocked(bootstrapErrorReporter.warn)).toHaveBeenCalledWith(
      error,
      { code: 'THEME_SYNC_FAILED' }
    );
    // Should still proceed
    expect(mockGalleryAppClass).toHaveBeenCalled();
  });

  it('should throw if GalleryApp initialization fails', async () => {
    const error = new Error('GalleryApp init failed');
    mockGalleryAppInstance.initialize.mockRejectedValueOnce(error);

    await expect(initializeGalleryApp()).rejects.toThrow();

    expect(vi.mocked(galleryErrorReporter.critical)).toHaveBeenCalledWith(
      error,
      { code: 'GALLERY_APP_INIT_FAILED' }
    );
  });

  it('should not re-initialize theme service if already initialized', async () => {
    mockThemeService.isInitialized.mockReturnValue(true);

    await initializeGalleryApp();

    expect(mockThemeService.initialize).not.toHaveBeenCalled();
  });

  it('deduplicates renderer registration when initialized concurrently', async () => {
    const [first, second] = await Promise.all([initializeGalleryApp(), initializeGalleryApp()]);

    expect(first).toBe(mockGalleryAppInstance);
    expect(second).toBe(mockGalleryAppInstance);
    expect(registerGalleryRenderer).toHaveBeenCalledTimes(1);
    expect(mockGalleryRendererClass).toHaveBeenCalledTimes(1);
  });
});
