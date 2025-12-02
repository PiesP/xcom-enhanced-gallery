
// Mock logger
vi.mock('@shared/logging', () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock CoreService functions. Ensure getInstance returns the same instance so
// test assertions can assert on the shared mock object that is used by the
// module under test.
// Typing as `any` is ok for test mocks; it simplifies assignable spy
// semantics (e.g., mockImplementationOnce) across imports.
const coreInstanceMockForBaseServices: any = {
  has: vi.fn(() => false),
  register: vi.fn(),
  get: vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) })),
};

vi.mock('@shared/services/service-manager', () => ({
  CoreService: {
    getInstance: vi.fn(() => coreInstanceMockForBaseServices),
  },
}));

// Mock ThemeService / LanguageService / MediaService
vi.mock('@shared/services/theme-service', () => ({
  ThemeService: {
    getInstance: vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) })),
  },
}));
vi.mock('@shared/services/language-service', () => ({
  LanguageService: {
    getInstance: vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) })),
  },
}));
vi.mock('@shared/services/media-service', () => ({
  MediaService: {
    getInstance: vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) })),
  },
}));

vi.mock('@/bootstrap/types', () => ({ reportBootstrapError: vi.fn() }));

describe('initializeCoreBaseServices', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Reset internal mock implementations on the stable instance so
    // expectations are clean for each run.
    coreInstanceMockForBaseServices.has = vi.fn(() => false);
    coreInstanceMockForBaseServices.register = vi.fn();
    coreInstanceMockForBaseServices.get = vi.fn(() => ({ initialize: vi.fn().mockResolvedValue(undefined) }));
  });

  it('should register missing base services and initialize them', async () => {
    const baseServicesModule = await import('@/bootstrap/base-services');
    await expect(baseServicesModule.initializeCoreBaseServices()).resolves.toBeUndefined();
    // Ensure CoreService methods were called via mocks
    const coreServiceModule = await import('@shared/services/service-manager');
    const coreInstance = coreServiceModule.CoreService.getInstance() as any;
    expect(coreInstance.register).toHaveBeenCalled();
    expect(coreInstance.get).toHaveBeenCalled();
  });

  it('should not register services that are already present', async () => {
    coreInstanceMockForBaseServices.has.mockReturnValue(true);
    const baseServicesModule = await import('@/bootstrap/base-services');
    await baseServicesModule.initializeCoreBaseServices();
    expect(coreInstanceMockForBaseServices.register).not.toHaveBeenCalled();
  });

  it('should skip initialization if service is not found', async () => {
    coreInstanceMockForBaseServices.get.mockReturnValue(null);
    const baseServicesModule = await import('@/bootstrap/base-services');
    await expect(baseServicesModule.initializeCoreBaseServices()).resolves.toBeUndefined();
  });

  it('should skip initialization if service has no initialize method', async () => {
    coreInstanceMockForBaseServices.get.mockReturnValue({}); // Object without initialize
    const baseServicesModule = await import('@/bootstrap/base-services');
    await expect(baseServicesModule.initializeCoreBaseServices()).resolves.toBeUndefined();
  });

  it('should call reportBootstrapError when initialization fails', async () => {
    // Make a service initialize throw
    const coreServiceModule = await import('@shared/services/service-manager');
    const coreInstance = coreServiceModule.CoreService.getInstance() as any;
    coreInstance.get.mockImplementationOnce(() => ({
      initialize: vi.fn().mockRejectedValue(new Error('fail')),
    }));

    const typesModule = await import('@/bootstrap/types');
    await expect(
      import('@/bootstrap/base-services').then(m => m.initializeCoreBaseServices())
    ).resolves.toBeUndefined();
    expect(typesModule.reportBootstrapError).toHaveBeenCalled();
  });
});
