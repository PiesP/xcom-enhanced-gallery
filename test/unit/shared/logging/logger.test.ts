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

  describe('Phase 124: 로그 레벨 필터링', () => {
    it('should filter out logs below minimum level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'error' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should emit all logs when level is DEBUG', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(infoSpy).toHaveBeenCalledTimes(2); // debug + info
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect INFO level (default)', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'info' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // debug는 필터링됨
      expect(infoSpy).toHaveBeenCalledTimes(1); // info만
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('should respect WARN level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'warn' });

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Phase 124: 메시지 포맷팅', () => {
    it('should format timestamp correctly', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'info', includeTimestamp: true });

      logger.info('test message');

      const firstCall = infoSpy.mock.calls[0];
      const prefix = String(firstCall?.[0]);

      expect(prefix).toMatch(/\[XEG\] \[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\]/);
    });

    it('should omit timestamp when includeTimestamp is false', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'info', includeTimestamp: false });

      logger.info('test message');

      const firstCall = infoSpy.mock.calls[0];
      const prefix = String(firstCall?.[0]);

      // ISO 8601 timestamp 패턴이 없어야 함
      expect(prefix).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(prefix).toContain('[XEG]');
      expect(prefix).toContain('[INFO]');
    });

    it('should include prefix in log messages', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'info' });

      logger.info('test message');

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[XEG]'), 'test message');
    });

    it('should format nested objects', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'info' });
      const testObj = { foo: 'bar', nested: { baz: 'qux' } };

      logger.info('object:', testObj);

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[XEG]'), 'object:', testObj);
    });
  });

  describe('Phase 124: 출력 채널', () => {
    it('should use console.info for INFO level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.info('info message');

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[INFO]'), 'info message');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should use console.warn for WARN level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.warn('warn message');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[WARN]'), 'warn message');
      expect(infoSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should use console.error for ERROR level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.error('error message');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), 'error message');
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should use console.info for DEBUG level', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.debug('debug message');

      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]'), 'debug message');
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Phase 124: 성능 최적화', () => {
    it('should handle timer operations efficiently', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.time('test-timer');

      // 타이머가 시작되었음을 확인
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining('Timer started: test-timer')
      );

      infoSpy.mockClear();

      logger.timeEnd('test-timer');

      // 타이머 종료 메시지 확인
      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringMatching(/test-timer: \d+ms/)
      );
    });

    it('should handle timer end without start gracefully', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'debug' });

      logger.timeEnd('non-existent-timer');

      expect(infoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        expect.stringContaining("Timer 'non-existent-timer' was not started")
      );
    });
  });

  describe('Phase 124: Scoped Logger', () => {
    it('should include scope in log messages', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createScopedLogger } = await importLoggerModule(true);
      const logger = createScopedLogger('TestScope', { level: 'info' });

      logger.info('scoped message');

      const firstCall = infoSpy.mock.calls[0];
      const prefix = String(firstCall?.[0]);

      expect(prefix).toContain('[XEG]');
      expect(prefix).toContain('[TestScope]');
      expect(prefix).toContain('[INFO]');
      expect(firstCall?.[1]).toBe('scoped message');
    });

    it('should support nested scopes', async () => {
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { createScopedLogger } = await importLoggerModule(true);
      const logger1 = createScopedLogger('Parent', { level: 'info' });
      const logger2 = createScopedLogger('Parent:Child', { level: 'info' });

      logger1.info('parent message');
      logger2.info('child message');

      const firstCallPrefix = String(infoSpy.mock.calls[0]?.[0]);
      const secondCallPrefix = String(infoSpy.mock.calls[1]?.[0]);

      expect(firstCallPrefix).toContain('[Parent]');
      expect(firstCallPrefix).toContain('[INFO]');
      expect(infoSpy.mock.calls[0]?.[1]).toBe('parent message');

      expect(secondCallPrefix).toContain('[Parent:Child]');
      expect(secondCallPrefix).toContain('[INFO]');
      expect(infoSpy.mock.calls[1]?.[1]).toBe('child message');
    });
  });

  describe('Phase 124: Error Stack Traces', () => {
    it('should include stack trace for Error objects', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'error', includeStackTrace: true });
      const testError = new Error('test error');

      logger.error(testError);

      expect(errorSpy).toHaveBeenCalledTimes(2); // 메시지 + stack trace
      expect(errorSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('[ERROR]'), testError);
      expect(errorSpy).toHaveBeenNthCalledWith(
        2,
        'Stack trace:',
        expect.stringContaining('Error: test error')
      );
    });

    it('should omit stack trace when includeStackTrace is false', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { createLogger } = await importLoggerModule(true);
      const logger = createLogger({ level: 'error', includeStackTrace: false });
      const testError = new Error('test error');

      logger.error(testError);

      expect(errorSpy).toHaveBeenCalledTimes(1); // 메시지만
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[ERROR]'), testError);
    });
  });
});
