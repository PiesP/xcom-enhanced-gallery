
describe('Logger', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should log in dev mode', async () => {
    vi.stubGlobal('__DEV__', true);
    const { createLogger } = await import('@shared/logging/logger');
    const logger = createLogger({ level: 'debug' });
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('test');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[XEG]'), 'test');
  });

  it('should not log in prod mode', async () => {
    vi.stubGlobal('__DEV__', false);
    const { createLogger } = await import('@shared/logging/logger');
    const logger = createLogger({ level: 'debug' });
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('test');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should respect log levels', async () => {
    vi.stubGlobal('__DEV__', true);
    const { createLogger } = await import('@shared/logging/logger');
    const logger = createLogger({ level: 'warn' });
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.info('should not log');
    logger.warn('should log');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[XEG]'), 'should log');
  });

  it('should create scoped logger', async () => {
    vi.stubGlobal('__DEV__', true);
    const { createScopedLogger } = await import('@shared/logging/logger');
    const logger = createScopedLogger('Scope');
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('test');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[XEG] [Scope]'), 'test');
  });

  it('should handle logError helper', async () => {
    vi.stubGlobal('__DEV__', true);
    const { logError } = await import('@shared/logging/logger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('test error', { context: 'val' }, 'Source');
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[XEG]'),
      expect.stringContaining('Error in Source: test error'),
      { context: 'val' },
    );
  });

  it('should handle logError with Error object', async () => {
    vi.stubGlobal('__DEV__', true);
    const { logError } = await import('@shared/logging/logger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError(new Error('test error obj'));
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('[XEG]'),
      expect.stringContaining('Error: test error obj'),
      {},
    );
  });

  it('should support trace method in dev mode', async () => {
    vi.stubGlobal('__DEV__', true);
    const { createLogger } = await import('@shared/logging/logger');
    const logger = createLogger({ level: 'debug' });
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.trace?.('trace message');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[XEG]'), 'trace message');
  });

  it('should not log trace when level is higher than debug', async () => {
    vi.stubGlobal('__DEV__', true);
    const { createLogger } = await import('@shared/logging/logger');
    const logger = createLogger({ level: 'info' });
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.trace?.('should not log');
    expect(spy).not.toHaveBeenCalled();
  });
});
