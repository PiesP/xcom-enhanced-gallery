/**
 * @fileoverview Tests for AppErrorReporter
 */


import {
  AppErrorReporter,
  bootstrapErrorReporter,
  downloadErrorReporter,
  galleryErrorReporter,
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

describe('AppErrorReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AppErrorReporter.setNotificationCallback(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(normalizeErrorMessage(error)).toBe('Test error message');
    });

    it('should return string errors as-is', () => {
      expect(normalizeErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from objects with message property', () => {
      const errorLike = { message: 'Object error message' };
      expect(normalizeErrorMessage(errorLike)).toBe('Object error message');
    });

    it('should handle null', () => {
      expect(normalizeErrorMessage(null)).toBe('null');
    });

    it('should handle undefined', () => {
      expect(normalizeErrorMessage(undefined)).toBe('undefined');
    });

    it('should stringify other objects', () => {
      const obj = { code: 123, details: 'test' };
      expect(normalizeErrorMessage(obj)).toBe(JSON.stringify(obj));
    });

    it('should handle empty Error', () => {
      const error = new Error();
      error.message = '';
      expect(normalizeErrorMessage(error)).toBe('Error');
    });
  });

  describe('report', () => {
    it('should report error with default severity', async () => {
      const { logger } = await import('@shared/logging');
      const error = new Error('Test error');

      const result = AppErrorReporter.report(error, {
        context: 'gallery',
      });

      expect(result.reported).toBe(true);
      expect(result.message).toBe('Test error');
      expect(result.context).toBe('gallery');
      expect(result.severity).toBe('error');
      expect(logger.error).toHaveBeenCalled();
    });

    it('should report warning severity', async () => {
      const { logger } = await import('@shared/logging');
      const error = new Error('Warning');

      AppErrorReporter.report(error, {
        context: 'settings',
        severity: 'warning',
      });

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should report info severity', async () => {
      const { logger } = await import('@shared/logging');

      AppErrorReporter.report('Info message', {
        context: 'ui',
        severity: 'info',
      });

      expect(logger.info).toHaveBeenCalled();
    });

    it('should throw for critical severity', () => {
      const error = new Error('Critical error');

      expect(() =>
        AppErrorReporter.report(error, {
          context: 'bootstrap',
          severity: 'critical',
        }),
      ).toThrow('Critical error');
    });

    it('should include metadata in log payload', async () => {
      const { logger } = await import('@shared/logging');
      const error = new Error('Test');

      AppErrorReporter.report(error, {
        context: 'media',
        metadata: { tweetId: '123', index: 0 },
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: { tweetId: '123', index: 0 },
        }),
      );
    });

    it('should call notification callback when notify is true', () => {
      const callback = vi.fn();
      AppErrorReporter.setNotificationCallback(callback);

      AppErrorReporter.report('Error', {
        context: 'download',
        notify: true,
      });

      expect(callback).toHaveBeenCalledWith('Error', 'download');
    });

    it('should not call notification callback when notify is false', () => {
      const callback = vi.fn();
      AppErrorReporter.setNotificationCallback(callback);

      AppErrorReporter.report('Error', {
        context: 'download',
        notify: false,
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reportAndReturn', () => {
    it('should report error and return default value', () => {
      const result = AppErrorReporter.reportAndReturn(
        new Error('Test'),
        { context: 'gallery' },
        null,
      );

      expect(result).toBeNull();
    });

    it('should not throw for critical severity', () => {
      const result = AppErrorReporter.reportAndReturn(
        new Error('Critical'),
        { context: 'bootstrap', severity: 'critical' },
        'fallback',
      );

      expect(result).toBe('fallback');
    });
  });

  describe('forContext', () => {
    it('should create context-bound reporter', async () => {
      const { logger } = await import('@shared/logging');
      const reporter = AppErrorReporter.forContext('gallery');

      reporter.error(new Error('Gallery error'));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Gallery]'),
        expect.any(Object),
      );
    });

    it('should support all severity levels', async () => {
      const { logger } = await import('@shared/logging');
      const reporter = AppErrorReporter.forContext('media');

      reporter.warn('Warning');
      expect(logger.warn).toHaveBeenCalled();

      reporter.info('Info');
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('pre-bound reporters', () => {
    it('bootstrapErrorReporter should report to bootstrap context', async () => {
      const { logger } = await import('@shared/logging');

      bootstrapErrorReporter.error(new Error('Bootstrap failed'));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Bootstrap]'),
        expect.any(Object),
      );
    });

    it('galleryErrorReporter should report to gallery context', async () => {
      const { logger } = await import('@shared/logging');

      galleryErrorReporter.warn('Gallery warning');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('[Gallery]'),
        expect.any(Object),
      );
    });

    it('downloadErrorReporter should report to download context', async () => {
      const { logger } = await import('@shared/logging');

      downloadErrorReporter.error(new Error('Download failed'));

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[Download]'),
        expect.any(Object),
      );
    });
  });
});
