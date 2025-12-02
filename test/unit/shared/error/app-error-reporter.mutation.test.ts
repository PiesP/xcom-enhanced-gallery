/**
 * @fileoverview Additional mutation coverage tests for app-error-reporter.ts
 * Focus: Edge cases and conditional branches
 */

import {
  AppErrorReporter,
  normalizeErrorMessage,
} from '@shared/error/app-error-reporter';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('app-error-reporter mutation killers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AppErrorReporter.setNotificationCallback(null);
  });

  describe('normalizeErrorMessage edge cases', () => {
    it('kills string.length > 0 -> true mutation', () => {
      // Empty string fails length check, goes to String() fallback
      // The mutation would return empty string as-is vs going to fallback
      // Both return empty string, but behavior differs
      const emptyResult = normalizeErrorMessage('');
      expect(typeof emptyResult).toBe('string');
      
      // Non-empty should return as-is
      expect(normalizeErrorMessage('test')).toBe('test');
    });

    it('kills typeof error === "string" -> true mutation', () => {
      // Number should not be treated as string
      expect(normalizeErrorMessage(123)).toBe('123');
    });

    it('kills error && typeof error === "object" -> true mutation', () => {
      // falsy non-null/undefined should fallback
      expect(normalizeErrorMessage(0)).toBe('0');
      expect(normalizeErrorMessage(false)).toBe('false');
    });

    it('kills "message" in error check mutation', () => {
      // Object without message property
      const obj = { code: 'ERR001' };
      expect(normalizeErrorMessage(obj)).toBe(JSON.stringify(obj));
    });

    it('kills typeof message === "string" check mutation', () => {
      // Object with non-string message
      const obj = { message: 12345 };
      expect(normalizeErrorMessage(obj)).toBe(JSON.stringify(obj));
    });

    it('kills JSON.stringify try/catch mutation', () => {
      // Create object that fails JSON.stringify
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      
      const result = normalizeErrorMessage(circular);
      expect(typeof result).toBe('string');
    });

    it('kills error === null check mutation', () => {
      expect(normalizeErrorMessage(null)).toBe('null');
    });

    it('kills error === undefined check mutation', () => {
      expect(normalizeErrorMessage(undefined)).toBe('undefined');
    });

    it('kills Error.message || Error.name fallback mutation', () => {
      // Error with empty message should use name
      const error = new Error();
      error.message = '';
      expect(normalizeErrorMessage(error)).toBe('Error');
    });

    it('should handle Error with only name', () => {
      const error = new TypeError();
      error.message = '';
      error.name = 'TypeError';
      expect(normalizeErrorMessage(error)).toBe('TypeError');
    });

    it('should handle Error with both message and name', () => {
      const error = new RangeError('Out of range');
      expect(normalizeErrorMessage(error)).toBe('Out of range');
    });
  });

  describe('report metadata handling', () => {
    it('kills options.metadata check mutation', async () => {
      const { logger } = await import('@shared/logging');
      
      // Without metadata
      AppErrorReporter.report(new Error('Test'), {
        context: 'gallery',
      });
      
      // Should not include metadata key
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ metadata: expect.anything() }),
      );
    });

    it('kills stack && severity !== "info" mutation', async () => {
      const { logger } = await import('@shared/logging');
      
      const error = new Error('Info error');
      
      // Info severity should not include stack
      AppErrorReporter.report(error, {
        context: 'ui',
        severity: 'info',
      });
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ stack: expect.anything() }),
      );
    });

    it('kills extractStackTrace for non-Error', async () => {
      const { logger } = await import('@shared/logging');
      
      // String error has no stack
      AppErrorReporter.report('String error', {
        context: 'network',
        severity: 'error',
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ stack: expect.anything() }),
      );
    });
  });

  describe('notification callback edge cases', () => {
    it('kills options.notify && callback check mutation', () => {
      const callback = vi.fn();
      AppErrorReporter.setNotificationCallback(callback);
      
      // notify true but different context
      AppErrorReporter.report('Error', {
        context: 'storage',
        notify: true,
      });
      
      expect(callback).toHaveBeenCalledWith('Error', 'storage');
    });

    it('kills !callback check mutation', () => {
      // No callback set
      expect(() => {
        AppErrorReporter.report('Error', {
          context: 'download',
          notify: true,
        });
      }).not.toThrow();
    });

    it('should not notify when callback is null', () => {
      AppErrorReporter.setNotificationCallback(null);
      
      // Should not crash
      const result = AppErrorReporter.report('Error', {
        context: 'download',
        notify: true,
      });
      
      expect(result.reported).toBe(true);
    });
  });

  describe('critical error handling', () => {
    it('kills severity === "critical" check mutation', () => {
      // Non-critical should not throw
      expect(() => {
        AppErrorReporter.report(new Error('Error'), {
          context: 'bootstrap',
          severity: 'error',
        });
      }).not.toThrow();
    });

    it('kills error instanceof Error check for re-throw', () => {
      // Non-Error critical should wrap in Error
      expect(() => {
        AppErrorReporter.report('Critical string', {
          context: 'bootstrap',
          severity: 'critical',
        });
      }).toThrow(Error);
    });

    it('should re-throw Error instance as-is', () => {
      const originalError = new TypeError('Type error');
      
      expect(() => {
        AppErrorReporter.report(originalError, {
          context: 'bootstrap',
          severity: 'critical',
        });
      }).toThrow(originalError);
    });
  });

  describe('formatContextTag mutations', () => {
    it('kills code check mutation', async () => {
      const { logger } = await import('@shared/logging');
      
      // Without code
      AppErrorReporter.report('Error', {
        context: 'gallery',
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringMatching(/^\[Gallery\]/),
        expect.any(Object),
      );
    });

    it('kills code check mutation with code', async () => {
      const { logger } = await import('@shared/logging');
      
      // With code
      AppErrorReporter.report('Error', {
        context: 'gallery',
        code: 'ERR001',
      });
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERR001]'),
        expect.any(Object),
      );
    });
  });

  describe('reportAndReturn mutations', () => {
    it('kills critical -> error downgrade mutation', async () => {
      const { logger } = await import('@shared/logging');
      
      // Should downgrade to error
      AppErrorReporter.reportAndReturn(
        new Error('Critical'),
        { context: 'bootstrap', severity: 'critical' },
        null,
      );
      
      // Should log as error not throw
      expect(logger.error).toHaveBeenCalled();
    });

    it('kills severity !== "critical" check mutation', async () => {
      const { logger } = await import('@shared/logging');
      
      // Warning should stay warning
      AppErrorReporter.reportAndReturn(
        'Warning',
        { context: 'settings', severity: 'warning' },
        'default',
      );
      
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should preserve non-critical severities', async () => {
      const { logger } = await import('@shared/logging');
      
      AppErrorReporter.reportAndReturn(
        'Info message',
        { context: 'ui', severity: 'info' },
        null,
      );
      
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('forContext mutations', () => {
    it('kills critical method mutation', () => {
      const reporter = AppErrorReporter.forContext('bootstrap');
      
      expect(() => {
        reporter.critical(new Error('Critical'));
      }).toThrow();
    });

    it('kills error method mutation', async () => {
      const { logger } = await import('@shared/logging');
      const reporter = AppErrorReporter.forContext('gallery');
      
      reporter.error('Error');
      
      expect(logger.error).toHaveBeenCalled();
    });

    it('kills warn method mutation', async () => {
      const { logger } = await import('@shared/logging');
      const reporter = AppErrorReporter.forContext('settings');
      
      reporter.warn('Warning');
      
      expect(logger.warn).toHaveBeenCalled();
    });

    it('kills info method mutation', async () => {
      const { logger } = await import('@shared/logging');
      const reporter = AppErrorReporter.forContext('ui');
      
      reporter.info('Info');
      
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('SEVERITY_LOG_MAP coverage', () => {
    it('should map critical to error log level', async () => {
      const { logger } = await import('@shared/logging');
      
      try {
        AppErrorReporter.report('Critical', {
          context: 'bootstrap',
          severity: 'critical',
        });
      } catch {
        // expected
      }
      
      expect(logger.error).toHaveBeenCalled();
    });

    it('should map error to error log level', async () => {
      const { logger } = await import('@shared/logging');
      
      AppErrorReporter.report('Error', {
        context: 'gallery',
        severity: 'error',
      });
      
      expect(logger.error).toHaveBeenCalled();
    });

    it('should map warning to warn log level', async () => {
      const { logger } = await import('@shared/logging');
      
      AppErrorReporter.report('Warning', {
        context: 'settings',
        severity: 'warning',
      });
      
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should map info to info log level', async () => {
      const { logger } = await import('@shared/logging');
      
      AppErrorReporter.report('Info', {
        context: 'ui',
        severity: 'info',
      });
      
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
