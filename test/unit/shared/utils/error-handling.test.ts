/**
 * @fileoverview Error Handling Utility Tests
 * @description Comprehensive tests for shared/utils/error-handling.ts
 * Coverage target: 90%+
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  isFatalError,
  serializeError,
  ErrorFactory,
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type StandardError,
} from '../../../../src/shared/utils/error-handling';

describe('error-handling utilities', () => {
  setupGlobalTestIsolation();

  describe('standardizeError', () => {
    it('should standardize Error objects with full context', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'testOperation',
        timestamp: Date.now(),
        metadata: { userId: '123' },
        retryable: true,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.NETWORK,
      };

      const result = standardizeError(error, context);

      expect(result.message).toBe('Test error');
      expect(result.context.operation).toBe('testOperation');
      expect(result.context.metadata).toEqual({ userId: '123' });
      expect(result.context.retryable).toBe(true);
      expect(result.originalError).toBe(error);
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const context: ErrorContext = {
        operation: 'testOp',
        timestamp: Date.now(),
      };

      const result = standardizeError(error, context);

      expect(result.message).toBe('Unknown error occurred');
      expect(result.originalError).toBeUndefined();
    });

    it('should include timestamp if not provided', () => {
      const error = new Error('Test');
      const context: ErrorContext = {
        operation: 'test',
        timestamp: 0,
      };

      const result = standardizeError(error, context);

      expect(result.context.timestamp).toBeGreaterThan(0);
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test');
      const result = standardizeError(error, {
        operation: 'test',
        timestamp: Date.now(),
      });

      expect(result.stack).toBeDefined();
      expect(typeof result.stack).toBe('string');

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test');
      const result = standardizeError(error, {
        operation: 'test',
        timestamp: Date.now(),
      });

      expect(result.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle null error', () => {
      const result = standardizeError(null, {
        operation: 'test',
        timestamp: Date.now(),
      });

      expect(result.message).toBe('Unknown error occurred');
      expect(result.originalError).toBeUndefined();
    });

    it('should handle undefined error', () => {
      const result = standardizeError(undefined, {
        operation: 'test',
        timestamp: Date.now(),
      });

      expect(result.message).toBe('Unknown error occurred');
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test message');
      expect(getErrorMessage(error)).toBe('Test message');
    });

    it('should return string errors directly', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message property from objects', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should use fallback for unknown types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error');
      expect(getErrorMessage(undefined)).toBe('Unknown error');
      expect(getErrorMessage(123)).toBe('Unknown error');
    });

    it('should use custom fallback', () => {
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const errors = [
        new Error('Network error occurred'),
        new Error('Request timeout'),
        new Error('Connection refused'),
        new Error('Fetch failed'),
        new Error('Resource load failed'),
      ];

      errors.forEach(error => {
        expect(isRetryableError(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const errors = [new Error('Validation failed'), new Error('Permission denied')];

      errors.forEach(error => {
        expect(isRetryableError(error)).toBe(false);
      });
    });

    it('should return false for non-Error types', () => {
      expect(isRetryableError('string')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(123)).toBe(false);
    });
  });

  describe('isFatalError', () => {
    it('should identify fatal errors', () => {
      const errors = [
        new Error('Out of memory'),
        new Error('Stack overflow'),
        new Error('Permission denied'),
        new Error('Security error occurred'),
        new Error('CORS error'),
      ];

      errors.forEach(error => {
        expect(isFatalError(error)).toBe(true);
      });
    });

    it('should identify non-fatal errors', () => {
      const errors = [new Error('Network timeout'), new Error('Validation failed')];

      errors.forEach(error => {
        expect(isFatalError(error)).toBe(false);
      });
    });

    it('should return false for non-Error types', () => {
      expect(isFatalError('string')).toBe(false);
      expect(isFatalError(null)).toBe(false);
    });
  });

  describe('serializeError', () => {
    it('should serialize Error objects', () => {
      const error = new Error('Test error');
      const serialized = serializeError(error);

      expect(serialized.name).toBe('Error');
      expect(serialized.message).toBe('Test error');
      expect(serialized.stack).toBeDefined();
    });

    it('should serialize plain objects', () => {
      const error = { code: 'ERR_TEST', message: 'Test' };
      const serialized = serializeError(error);

      expect(serialized.code).toBe('ERR_TEST');
      expect(serialized.message).toBe('Test');
    });

    it('should handle circular references', () => {
      const error: Record<string, unknown> = { message: 'Test' };
      error.self = error; // circular reference

      const serialized = serializeError(error);
      expect(serialized.error).toBeDefined();
    });

    it('should serialize primitive values', () => {
      expect(serializeError('string error')).toEqual({ error: 'string error' });
      expect(serializeError(123)).toEqual({ error: '123' });
      expect(serializeError(null)).toEqual({ error: 'null' });
    });
  });

  describe('ErrorFactory', () => {
    describe('network', () => {
      it('should create network error with correct properties', () => {
        const error = ErrorFactory.network('Network failed', {
          operation: 'fetch',
          retryable: true,
        });

        expect(error.message).toBe('Network failed');
        expect(error.context.category).toBe(ErrorCategory.NETWORK);
        expect(error.context.severity).toBe(ErrorSeverity.HIGH);
        expect(error.context.operation).toBe('fetch');
        expect(error.context.retryable).toBe(true);
      });
    });

    describe('validation', () => {
      it('should create validation error', () => {
        const error = ErrorFactory.validation('Invalid data', {
          operation: 'validate',
          metadata: { field: 'email' },
        });

        expect(error.message).toBe('Invalid data');
        expect(error.context.category).toBe(ErrorCategory.VALIDATION);
        expect(error.context.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context.metadata).toEqual({ field: 'email' });
      });
    });

    describe('processing', () => {
      it('should create processing error', () => {
        const error = ErrorFactory.processing('Processing failed', {
          operation: 'process',
        });

        expect(error.message).toBe('Processing failed');
        expect(error.context.category).toBe(ErrorCategory.PROCESSING);
        expect(error.context.severity).toBe(ErrorSeverity.HIGH);
      });
    });

    describe('system', () => {
      it('should create system error marked as fatal', () => {
        const error = ErrorFactory.system('System crashed', {
          operation: 'boot',
        });

        expect(error.message).toBe('System crashed');
        expect(error.context.category).toBe(ErrorCategory.SYSTEM);
        expect(error.context.severity).toBe(ErrorSeverity.CRITICAL);
        expect(error.context.fatal).toBe(true);
      });
    });

    describe('generic', () => {
      it('should create generic error with defaults', () => {
        const error = ErrorFactory.generic('Generic error');

        expect(error.message).toBe('Generic error');
        expect(error.context.category).toBe(ErrorCategory.UNKNOWN);
        expect(error.context.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context.operation).toBe('unknown');
      });

      it('should accept custom category and severity', () => {
        const error = ErrorFactory.generic(
          'Custom error',
          ErrorCategory.NETWORK,
          ErrorSeverity.LOW,
          { operation: 'custom' }
        );

        expect(error.context.category).toBe(ErrorCategory.NETWORK);
        expect(error.context.severity).toBe(ErrorSeverity.LOW);
        expect(error.context.operation).toBe('custom');
      });
    });
  });

  describe('ErrorSeverity enum', () => {
    it('should have correct values', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('ErrorCategory enum', () => {
    it('should have correct values', () => {
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.PROCESSING).toBe('processing');
      expect(ErrorCategory.SYSTEM).toBe('system');
      expect(ErrorCategory.UNKNOWN).toBe('unknown');
    });
  });
});
