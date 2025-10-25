/**
 * @fileoverview Error Handling 라이브러리 테스트 (Phase A5.4)
 *
 * 확장된 에러 처리 기능:
 * - 에러 심각도 레벨 (ErrorSeverity)
 * - 에러 카테고리 (ErrorCategory)
 * - Error Factory 패턴
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorSeverity,
  ErrorCategory,
  ErrorFactory,
  standardizeError,
  getErrorMessage,
  isRetryableError,
  type StandardError,
  type ErrorContext,
  type ErrorFactoryContext,
} from '../../../src/shared/utils/error-handling';

describe('Error Handling - Phase A5.4 Enhancement', () => {
  describe('ErrorSeverity enum', () => {
    it('should define severity levels correctly', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('ErrorCategory enum', () => {
    it('should define error categories correctly', () => {
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.PROCESSING).toBe('processing');
      expect(ErrorCategory.SYSTEM).toBe('system');
      expect(ErrorCategory.UNKNOWN).toBe('unknown');
    });
  });

  describe('ErrorFactory.network()', () => {
    it('should create network error with correct severity and category', () => {
      const error = ErrorFactory.network('Connection failed', {
        operation: 'fetchMedia',
        retryable: true,
      });

      expect(error).toHaveProperty('message', 'Connection failed');
      expect(error.context.category).toBe(ErrorCategory.NETWORK);
      expect(error.context.severity).toBe(ErrorSeverity.HIGH);
      expect(error.context.retryable).toBe(true);
      expect(error.context.operation).toBe('fetchMedia');
    });

    it('should set timestamp automatically', () => {
      const before = Date.now();
      const error = ErrorFactory.network('Network error', { operation: 'test' });
      const after = Date.now();

      expect(error.context.timestamp).toBeGreaterThanOrEqual(before);
      expect(error.context.timestamp).toBeLessThanOrEqual(after);
    });

    it('should allow custom timestamp in context', () => {
      const customTime = 1000000;
      const error = ErrorFactory.network('Network error', {
        operation: 'test',
        timestamp: customTime,
      });

      expect(error.context.timestamp).toBe(customTime);
    });
  });

  describe('ErrorFactory.validation()', () => {
    it('should create validation error with medium severity', () => {
      const error = ErrorFactory.validation('Invalid input', {
        operation: 'validateMedia',
        metadata: { field: 'url' },
      });

      expect(error.context.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.metadata).toHaveProperty('field', 'url');
    });
  });

  describe('ErrorFactory.processing()', () => {
    it('should create processing error with high severity', () => {
      const error = ErrorFactory.processing('Failed to process image', {
        operation: 'imageExtraction',
      });

      expect(error.context.category).toBe(ErrorCategory.PROCESSING);
      expect(error.context.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('ErrorFactory.system()', () => {
    it('should create system error with critical severity and fatal flag', () => {
      const error = ErrorFactory.system('System failure', {
        operation: 'bootstrap',
      });

      expect(error.context.category).toBe(ErrorCategory.SYSTEM);
      expect(error.context.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.context.fatal).toBe(true);
    });
  });

  describe('ErrorFactory.generic()', () => {
    it('should create generic error with custom category and severity', () => {
      const error = ErrorFactory.generic(
        'Custom error',
        ErrorCategory.VALIDATION,
        ErrorSeverity.LOW,
        { operation: 'customOp' }
      );

      expect(error.message).toBe('Custom error');
      expect(error.context.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.severity).toBe(ErrorSeverity.LOW);
    });

    it('should use defaults for missing parameters', () => {
      const error = ErrorFactory.generic('Error message');

      expect(error.context.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.context.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.context.operation).toBe('unknown');
    });
  });

  describe('standardizeError with extended properties', () => {
    it('should include category and severity in context', () => {
      const context: ErrorContext = {
        operation: 'test',
        timestamp: Date.now(),
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
      };

      const error = standardizeError(new Error('Test error'), context);

      expect(error.context.category).toBe(ErrorCategory.NETWORK);
      expect(error.context.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('Error hierarchy and categorization', () => {
    it('should properly categorize different error types', () => {
      const errors = [
        {
          factory: () => ErrorFactory.network('Network error', { operation: 'test' }),
          expected: ErrorCategory.NETWORK,
        },
        {
          factory: () => ErrorFactory.validation('Validation error', { operation: 'test' }),
          expected: ErrorCategory.VALIDATION,
        },
        {
          factory: () => ErrorFactory.processing('Processing error', { operation: 'test' }),
          expected: ErrorCategory.PROCESSING,
        },
        {
          factory: () => ErrorFactory.system('System error', { operation: 'test' }),
          expected: ErrorCategory.SYSTEM,
        },
      ];

      errors.forEach(({ factory, expected }) => {
        const error = factory();
        expect(error.context.category).toBe(expected);
      });
    });

    it('should properly rank severity levels', () => {
      const severities = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL,
      ];

      const severityMap: Record<ErrorSeverity, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      severities.forEach(sev => {
        expect(severityMap[sev]).toBeDefined();
      });
    });
  });

  describe('Error context with metadata', () => {
    it('should preserve metadata through error creation', () => {
      const metadata = {
        url: 'https://example.com',
        retryCount: 3,
      };

      const error = ErrorFactory.network('Download failed', {
        operation: 'download',
        metadata,
      });

      expect(error.context.metadata).toEqual(metadata);
    });

    it('should allow adding metadata to different error types', () => {
      const errors = [
        ErrorFactory.network('Net error', { operation: 'op1', metadata: { code: 'NET_001' } }),
        ErrorFactory.validation('Val error', { operation: 'op2', metadata: { field: 'email' } }),
        ErrorFactory.processing('Proc error', { operation: 'op3', metadata: { step: 1 } }),
      ];

      errors.forEach(err => {
        expect(err.context.metadata).toBeDefined();
        expect(typeof err.context.metadata).toBe('object');
      });
    });
  });

  describe('Error compatibility with existing getErrorMessage', () => {
    it('should extract message from factory-created errors', () => {
      const msg = 'Operation failed';
      const error = ErrorFactory.network(msg, { operation: 'test' });

      const extracted = getErrorMessage(error);
      expect(extracted).toContain(msg); // May contain additional context
    });

    it('should handle retryability for different categories', () => {
      const networkError = ErrorFactory.network('Network error', {
        operation: 'test',
        retryable: true,
      });

      const validationError = ErrorFactory.validation('Validation error', {
        operation: 'test',
        retryable: false,
      });

      expect(networkError.context.retryable).toBe(true);
      expect(validationError.context.retryable).toBe(false);
    });
  });

  describe('Error factory practical usage scenarios', () => {
    it('should handle image loading failure scenario', () => {
      const error = ErrorFactory.processing('Failed to load image', {
        operation: 'imageLoad',
        metadata: { url: 'https://example.com/image.jpg', width: 800 },
        retryable: true,
      });

      expect(error.context.category).toBe(ErrorCategory.PROCESSING);
      expect(error.context.metadata?.url).toBe('https://example.com/image.jpg');
      expect(error.context.retryable).toBe(true);
    });

    it('should handle download error scenario', () => {
      const error = ErrorFactory.network('Download timeout', {
        operation: 'bulkDownload',
        metadata: { fileCount: 5, downloadedCount: 2 },
        retryable: true,
      });

      expect(error.context.category).toBe(ErrorCategory.NETWORK);
      expect(error.context.metadata?.fileCount).toBe(5);
    });

    it('should handle settings validation error scenario', () => {
      const error = ErrorFactory.validation('Invalid theme value', {
        operation: 'updateSettings',
        metadata: { setting: 'theme', value: 'invalid', allowedValues: ['light', 'dark'] },
      });

      expect(error.context.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.metadata?.allowedValues).toEqual(['light', 'dark']);
    });
  });

  describe('ErrorFactoryContext type compliance', () => {
    it('should accept ErrorFactoryContext without timestamp requirement', () => {
      const context: ErrorFactoryContext = {
        operation: 'test',
        metadata: { key: 'value' },
        retryable: true,
      };

      const error = ErrorFactory.network('Test error', context);
      expect(error.context.timestamp).toBeDefined();
      expect(error.context.operation).toBe('test');
    });
  });
});
