
vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const reportBootstrapErrorMock = vi.fn();
vi.mock('@/bootstrap/types', () => ({
  reportBootstrapError: reportBootstrapErrorMock,
}));

const originalVitestFlag = process.env.VITEST;

describe('initializeDevTools', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.VITEST = originalVitestFlag ?? '1';
  });

  afterAll(() => {
    if (typeof originalVitestFlag === 'undefined') {
      Reflect.deleteProperty(process.env, 'VITEST');
    } else {
      process.env.VITEST = originalVitestFlag;
    }
  });

  it('initializes dev tools only once', async () => {
    const { initializeDevTools } = await import('@/bootstrap/dev-tools');
    const { logger } = await import('@shared/logging');

    await initializeDevTools();
    await initializeDevTools();

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(reportBootstrapErrorMock).not.toHaveBeenCalled();
  });

  it('skips initialization when VITEST flag is absent in test mode', async () => {
    Reflect.deleteProperty(process.env, 'VITEST');
    vi.resetModules();

    const { initializeDevTools } = await import('@/bootstrap/dev-tools');
    const { logger } = await import('@shared/logging');

    await initializeDevTools();

    expect(logger.debug).toHaveBeenCalledWith('[dev-tools] Initialization skipped (test mode)');
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('reports bootstrap error when diagnostics initialization fails', async () => {
    const { initializeDevTools } = await import('@/bootstrap/dev-tools');
    const { logger } = await import('@shared/logging');
    const failure = new Error('diagnostics crash');
    const infoMock = logger.info as unknown as ReturnType<typeof vi.fn>;
    infoMock.mockImplementationOnce(() => {
      throw failure;
    });

    await initializeDevTools();

    expect(reportBootstrapErrorMock).toHaveBeenCalledWith(failure, {
      context: 'dev-tools',
      logger,
    });
  });
});
