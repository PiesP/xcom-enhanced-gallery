/**
 * @fileoverview Bootstrap Types Unit Tests
 * @description Phase 348: Error handling strategy tests
 */

import { describe, it, expect, vi } from 'vitest';
import { reportBootstrapError } from '@/bootstrap/types';

describe('Bootstrap error helpers', () => {
  const createLogger = () => ({
    error: vi.fn(),
    warn: vi.fn(),
  });

  it('logs warnings without throwing by default', () => {
    const logger = createLogger();
    const error = new Error('Recoverable issue');

    expect(() =>
      reportBootstrapError(error, {
        context: 'features',
        logger,
      })
    ).not.toThrow();

    expect(logger.warn).toHaveBeenCalledWith(
      '[features] initialization failed: Recoverable issue',
      error
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs errors and rethrows for critical severity', () => {
    const logger = createLogger();
    const error = new Error('Critical failure');

    expect(() =>
      reportBootstrapError(error, {
        context: 'environment',
        severity: 'critical',
        logger,
      })
    ).toThrow('Critical failure');

    expect(logger.error).toHaveBeenCalledWith(
      '[environment] initialization failed: Critical failure',
      error
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('normalizes non-error inputs', () => {
    const logger = createLogger();

    reportBootstrapError('string failure', {
      context: 'base-services',
      logger,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      '[base-services] initialization failed: string failure',
      'string failure'
    );
  });
});
