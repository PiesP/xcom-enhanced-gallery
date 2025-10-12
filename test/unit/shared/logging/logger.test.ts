import { afterEach, describe, expect, it, vi } from 'vitest';

type LoggerModule = typeof import('@shared/logging/logger');

const findCallContaining = (calls: unknown[][], needle: string): unknown[] | undefined =>
  calls.find(call =>
    call
      .map(argument => String(argument))
      .join(' ')
      .includes(needle)
  );

const importLoggerModule = async (dev: boolean): Promise<LoggerModule> => {
  vi.resetModules();
  const mode = dev ? 'development' : 'production';
  vi.stubGlobal('__DEV__', dev);
  vi.stubGlobal('import', {
    meta: {
      env: {
        MODE: mode,
        DEV: dev,
        PROD: !dev,
      },
    },
  });
  return await import('@shared/logging/logger');
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('logger', () => {
  it('emits rich diagnostics in development mode', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logger, createScopedLoggerWithCorrelation, logError } = await importLoggerModule(true);

    const nowSpy = vi.spyOn(Date, 'now').mockReturnValueOnce(100).mockReturnValueOnce(220);

    logger.debug('dev-debug', { feature: 'gallery' });
    logger.time('phase');
    logger.timeEnd('phase');

    const scoped = createScopedLoggerWithCorrelation('Perf', 'dev-123');
    scoped.info('scoped info');

    const debugCall = findCallContaining(infoSpy.mock.calls, 'dev-debug');
    expect(debugCall).toBeDefined();
    expect(String(debugCall![0])).toContain('[XEG]');
    expect(String(debugCall![0])).toContain('[DEBUG]');

    const scopeCall = findCallContaining(infoSpy.mock.calls, 'scoped info');
    expect(scopeCall).toBeDefined();
    expect(String(scopeCall![0])).toContain('[Perf]');
    expect(String(scopeCall![0])).toContain('[cid:dev-123]');

    const timerStart = findCallContaining(infoSpy.mock.calls, 'Timer started: phase');
    expect(timerStart).toBeDefined();

    const timerEnd = findCallContaining(infoSpy.mock.calls, 'phase: 120ms');
    expect(timerEnd).toBeDefined();

    nowSpy.mockRestore();

    const sampleError = new Error('failure');
    logError(sampleError, { stage: 'dev' }, 'TestSource');
    expect(errorSpy).toHaveBeenCalled();

    const stackCall = findCallContaining(infoSpy.mock.calls, 'Error stack:');
    expect(stackCall).toBeDefined();
  });

  it('squelches debug utilities in production mode', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { createLogger, createScopedLoggerWithCorrelation } = await importLoggerModule(false);

    const prodLogger = createLogger({
      level: 'warn',
      includeTimestamp: false,
      includeStackTrace: false,
    });

    prodLogger.debug('prod-debug');
    prodLogger.time('phase');
    prodLogger.timeEnd('phase');
    prodLogger.info('prod-info');

    const scoped = createScopedLoggerWithCorrelation('Bulk', 'cid-42', { level: 'warn' });
    scoped.warn('scoped warn');
    scoped.error('scoped error');

    prodLogger.warn('global warn');
    prodLogger.error('global error');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledTimes(2);

    const warnPrefix = String(warnSpy.mock.calls[0][0]);
    expect(warnPrefix).toContain('[XEG]');
    expect(warnPrefix).toContain('[cid:cid-42]');

    const errorPrefix = String(errorSpy.mock.calls[0][0]);
    expect(errorPrefix).toContain('[XEG]');
    expect(errorPrefix).toContain('[cid:cid-42]');
  });
});
