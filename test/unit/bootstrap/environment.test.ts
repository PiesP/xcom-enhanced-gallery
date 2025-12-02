import { initializeEnvironment } from '@/bootstrap/environment';

const { initializeVendorsMock, reportBootstrapErrorMock } = vi.hoisted(() => ({
  initializeVendorsMock: vi.fn(),
  reportBootstrapErrorMock: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@shared/external/vendors', () => ({
  initializeVendors: initializeVendorsMock,
}));

vi.mock('@/bootstrap/types', () => ({
  reportBootstrapError: reportBootstrapErrorMock,
}));

describe('initializeEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeVendorsMock.mockResolvedValue(undefined);
  });

  it('initializes vendors and logs in development mode', async () => {
    await initializeEnvironment();

    expect(initializeVendorsMock).toHaveBeenCalledTimes(1);
    const { logger } = await import('@shared/logging');
    expect(logger.debug).toHaveBeenCalledWith('[environment] ✅ Vendors initialized');
    expect(reportBootstrapErrorMock).not.toHaveBeenCalled();
  });

  it('reports critical error when vendor initialization fails', async () => {
    const failure = new Error('vendor failure');
    initializeVendorsMock.mockRejectedValueOnce(failure);

    await initializeEnvironment();

    const { logger } = await import('@shared/logging');
    expect(reportBootstrapErrorMock).toHaveBeenCalledWith(failure, {
      context: 'environment',
      severity: 'critical',
      logger,
    });
  });
});
