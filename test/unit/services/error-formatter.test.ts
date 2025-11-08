import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  formatErrorMessage,
  formatErrorForLogging,
  createErrorContext,
  type ErrorContext,
} from '../../../src/shared/services/error-formatter';

describe('Error Formatter (Phase 314-2)', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).__VITEST__;
  });

  describe('formatErrorMessage', () => {
    it('should format network error with environment context', () => {
      (globalThis as any).__VITEST__ = true;

      const context: ErrorContext = {
        environment: 'test',
        method: 'GET',
        url: 'https://api.example.com/data',
        message: 'Failed to fetch',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('context');
      expect(formatted).toHaveProperty('suggestion');
      expect(formatted).toHaveProperty('canRetry');

      expect(formatted.message).toContain('GET');
      expect(formatted.message).toContain('https://api.example.com/data');
      expect(formatted.context).toContain('test');
    });

    it('should provide Tampermonkey-specific suggestions for network errors', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'POST',
        url: 'https://api.twitter.com/data',
        message: 'Network error',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.suggestion).toContain('@connect');
    });

    it('should suggest mocking for test environment errors', () => {
      (globalThis as any).__VITEST__ = true;

      const context: ErrorContext = {
        environment: 'test',
        method: 'GET',
        url: 'https://api.example.com/test',
        status: 0,
        timeout: undefined,
        message: 'Network error',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.suggestion).toContain('test');
      expect(formatted.suggestion).toContain('Mock');
    });

    it('should handle 401 Unauthorized errors', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'GET',
        url: 'https://api.example.com/protected',
        status: 401,
        message: 'Unauthorized',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.message).toContain('401');
      expect(formatted.suggestion).toContain('authentication');
      expect(formatted.canRetry).toBe(false);
    });

    it('should handle 404 Not Found errors', () => {
      const context: ErrorContext = {
        environment: 'console',
        method: 'GET',
        url: 'https://api.example.com/missing',
        status: 404,
        message: 'Not Found',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.message).toContain('404');
      expect(formatted.suggestion).toContain('URL');
      expect(formatted.canRetry).toBe(false);
    });

    it('should handle 500 Server errors', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'POST',
        url: 'https://api.example.com/action',
        status: 500,
        message: 'Internal Server Error',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.message).toContain('500');
      expect(formatted.suggestion).toContain('Retry');
      expect(formatted.canRetry).toBe(true);
    });

    it('should handle timeout errors with retryability', () => {
      const context: ErrorContext = {
        environment: 'test',
        method: 'GET',
        url: 'https://api.example.com/slow',
        timeout: 5000,
        message: 'Timeout',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.message).toContain('Timeout');
      expect(formatted.suggestion).toContain('5000ms');
      expect(formatted.canRetry).toBe(true);
    });

    it('should include all required context fields', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'DELETE',
        url: 'https://api.example.com/resource/123',
        status: 500,
        timeout: 10000,
        message: 'Server error',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.message).toContain('DELETE');
      expect(formatted.message).toContain('resource/123');
      expect(formatted.message).toContain('500');
    });
  });

  describe('formatErrorForLogging', () => {
    it('should create well-formatted error log message', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'GET',
        url: 'https://api.example.com/data',
        status: 404,
        message: 'Not Found',
      };

      const errorMsg = new Error('Resource not found');
      const log = formatErrorForLogging(errorMsg, context);

      expect(log).toContain('HTTP Request Error');
      expect(log).toContain('━━━');
      expect(log).toContain('GET');
      expect(log).toContain('404');
      expect(log).toContain('Suggestion');
      expect(log).toContain('Retryable');
    });

    it('should handle string errors', () => {
      const context: ErrorContext = {
        environment: 'test',
        method: 'POST',
        url: 'https://api.example.com/action',
        message: 'Network failure',
      };

      const log = formatErrorForLogging('Connection failed', context);

      expect(log).toContain('Connection failed');
      expect(log).toContain('POST');
    });

    it('should include retryability status', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'GET',
        url: 'https://api.example.com/data',
        status: 403,
        message: 'Forbidden',
      };

      const log = formatErrorForLogging(new Error('Unauthorized'), context);

      expect(log).toContain('Retryable');
      expect(log).toContain('❌ No'); // Not retryable for 403
    });
  });

  describe('createErrorContext', () => {
    it('should create error context from HTTP response', () => {
      const context = createErrorContext('GET', 'https://api.example.com/data', 404, 'Not Found', {
        timeout: 5000,
        message: 'Resource not found',
      });

      expect(context.method).toBe('GET');
      expect(context.url).toBe('https://api.example.com/data');
      expect(context.status).toBe(404);
      expect(context.timeout).toBe(5000);
      expect(context.message).toBe('Resource not found');
      // Environment will be detected, but we don't assert specific value
      // since it depends on test environment
      expect(context.environment).toBeDefined();
    });

    it('should detect environment automatically', () => {
      const context = createErrorContext('POST', 'https://api.example.com/action', 500, 'Error');

      expect(context.environment).toBeDefined();
      expect(['userscript', 'test', 'extension', 'console']).toContain(context.environment);
    });

    it('should handle missing optional options', () => {
      const context = createErrorContext(
        'DELETE',
        'https://api.example.com/resource/123',
        204,
        'No Content'
      );

      expect(context.method).toBe('DELETE');
      expect(context.url).toBe('https://api.example.com/resource/123');
      expect(context.status).toBe(204);
      expect(context.message).toBe('No Content');
    });

    it('should use statusText as fallback message', () => {
      const context = createErrorContext(
        'PUT',
        'https://api.example.com/update',
        400,
        'Bad Request'
      );

      expect(context.message).toBe('Bad Request');
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle CORS errors appropriately', () => {
      const context: ErrorContext = {
        environment: 'userscript',
        method: 'GET',
        url: 'https://cross-origin.example.com/api',
        status: 0,
        timeout: undefined,
        message: 'Network error',
      };

      const formatted = formatErrorMessage(context);

      expect(formatted.suggestion).toContain('@connect');
      expect(formatted.canRetry).toBe(true);
    });

    it('should differentiate between auth and permission errors', () => {
      const authContext: ErrorContext = {
        environment: 'userscript',
        method: 'POST',
        url: 'https://api.example.com/secure',
        status: 401,
        timeout: undefined,
        message: 'Unauthorized',
      };

      const permContext: ErrorContext = {
        environment: 'userscript',
        method: 'DELETE',
        url: 'https://api.example.com/resource',
        status: 403,
        timeout: undefined,
        message: 'Forbidden',
      };

      const authFormatted = formatErrorMessage(authContext);
      const permFormatted = formatErrorMessage(permContext);

      // Both should not be retryable
      expect(authFormatted.canRetry).toBe(false);
      expect(permFormatted.canRetry).toBe(false);

      // Messages should include status codes
      expect(authFormatted.message).toContain('401');
      expect(permFormatted.message).toContain('403');
    });
  });
});
