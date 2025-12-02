import {
  registerFeatureLoader,
  registerFeatureServicesLazy,
  resetFeatureLoaders,
} from '@/bootstrap/features';
import { APP_SETTINGS_STORAGE_KEY } from '@/constants';
import { getPersistentStorage } from '@shared/services/persistent-storage';

const { reportBootstrapErrorMock } = vi.hoisted(() => ({
  reportBootstrapErrorMock: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@shared/services/persistent-storage', () => ({
  getPersistentStorage: vi.fn(),
}));

vi.mock('@/bootstrap/types', () => ({
  reportBootstrapError: reportBootstrapErrorMock,
}));

const getPersistentStorageMock = getPersistentStorage as unknown as ReturnType<typeof vi.fn>;

describe('registerFeatureServicesLazy', () => {
  let storageInstance: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    resetFeatureLoaders();
    storageInstance = {
      get: vi.fn().mockResolvedValue({
        features: {
          gallery: true,
          settings: true,
          download: true,
        },
      }),
    };
    getPersistentStorageMock.mockReturnValue(storageInstance);
  });

  afterEach(() => {
    const scopedGlobal = globalThis as { __XEG_DEV__?: boolean };
    delete scopedGlobal.__XEG_DEV__;
  });

  it('loads persisted feature flags and logs success', async () => {
    await registerFeatureServicesLazy();

    expect(storageInstance.get).toHaveBeenCalledWith(APP_SETTINGS_STORAGE_KEY);

    const { logger } = await import('@shared/logging');
    expect(logger.debug).toHaveBeenCalledWith('[features] Settings loaded successfully');
    expect(logger.debug).toHaveBeenCalledWith('[features] ✅ Feature services registered');
  });

  it('reports bootstrap error when debug logging throws', async () => {
    const { logger } = await import('@shared/logging');
    const failure = new Error('debug failure');
    const debugMock = logger.debug as unknown as ReturnType<typeof vi.fn>;
    debugMock.mockImplementationOnce(() => {
      throw failure;
    });

    await registerFeatureServicesLazy();

    expect(reportBootstrapErrorMock).toHaveBeenCalledWith(failure, {
      context: 'features',
      logger,
    });
  });

  it('falls back to default feature settings when storage fails', async () => {
    const failingGet = vi.fn().mockRejectedValue(new Error('storage offline'));
    getPersistentStorageMock.mockReturnValueOnce({
      get: failingGet,
    });

    await registerFeatureServicesLazy();

    const { logger } = await import('@shared/logging');
    expect(logger.warn).toHaveBeenCalledWith(
      '[features] Settings loading failed - using defaults:',
      expect.any(Error),
    );
    expect(reportBootstrapErrorMock).not.toHaveBeenCalled();
  });

  it('executes registered feature loaders when their flag is enabled', async () => {
    const loader = vi.fn().mockResolvedValue(undefined);
    registerFeatureLoader({
      flag: 'gallery',
      name: 'Gallery Core',
      load: loader,
    });

    await registerFeatureServicesLazy();

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it('skips loaders whose flags are disabled in settings', async () => {
    storageInstance.get.mockResolvedValueOnce({
      features: {
        gallery: false,
      },
    });

    const loader = vi.fn();
    registerFeatureLoader({
      flag: 'gallery',
      name: 'Gallery Core',
      load: loader,
    });

    await registerFeatureServicesLazy();

    expect(loader).not.toHaveBeenCalled();
  });

  it('omits dev-only loaders when dev override is disabled', async () => {
    const scopedGlobal = globalThis as { __XEG_DEV__?: boolean };
    scopedGlobal.__XEG_DEV__ = false;

    const loader = vi.fn();
    registerFeatureLoader({
      flag: 'gallery',
      name: 'Dev Tools',
      load: loader,
      devOnly: true,
    });

    await registerFeatureServicesLazy();

    expect(loader).not.toHaveBeenCalled();
  });

  it('continues registering other features when a loader fails', async () => {
    const failure = new Error('boom');
    const failingLoader = vi.fn().mockRejectedValue(failure);
    const succeedingLoader = vi.fn().mockResolvedValue(undefined);

    registerFeatureLoader({ flag: 'gallery', name: 'Gallery', load: failingLoader });
    registerFeatureLoader({ flag: 'settings', name: 'Settings', load: succeedingLoader });

    await registerFeatureServicesLazy();

    expect(failingLoader).toHaveBeenCalled();
    expect(succeedingLoader).toHaveBeenCalled();

    const { logger } = await import('@shared/logging');
    expect(logger.warn).toHaveBeenCalledWith(
      '[features] ⚠️ Gallery registration failed (continuing):',
      failure,
    );
  });
});
