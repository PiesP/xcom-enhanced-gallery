import { reportBootstrapError } from '@/bootstrap/types';

describe('reportBootstrapError', () => {
  const createLogger = () => ({
    error: vi.fn(),
    warn: vi.fn(),
  });

  it('logs recoverable errors as warnings by default', () => {
    const logger = createLogger();
    const error = new Error('recoverable issue');

    expect(() =>
      reportBootstrapError(error, {
        context: 'bootstrap',
        logger,
      }),
    ).not.toThrow();

    expect(logger.warn).toHaveBeenCalledWith(
      '[bootstrap] initialization failed: recoverable issue',
      error,
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('rethrows critical errors and logs with error severity', () => {
    const logger = createLogger();

    expect(() =>
      reportBootstrapError('database gone', {
        context: 'critical-stage',
        severity: 'critical',
        logger,
      }),
    ).toThrow('[critical-stage] initialization failed: database gone');

    expect(logger.error).toHaveBeenCalledWith(
      '[critical-stage] initialization failed: database gone',
      'database gone',
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('normalizes unknown error payloads into readable messages', () => {
    const logger = createLogger();
    const payload = { reason: 'mystery' };

    expect(() =>
      reportBootstrapError(payload, {
        context: 'mystery-stage',
        severity: 'critical',
        logger,
      }),
    ).toThrow('[mystery-stage] initialization failed: Unknown bootstrap error');

    expect(logger.error).toHaveBeenCalledWith(
      '[mystery-stage] initialization failed: Unknown bootstrap error',
      payload,
    );
  });
});
