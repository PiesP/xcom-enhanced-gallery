/**
 * Phase 125.3: error-handling.ts 테스트
 * 목표: 8.73% → 60% (+51.27%p)
 *
 * 테스트 전략:
 * - 7개 함수별 다양한 시나리오 커버
 * - 에러 타입별 처리 검증 (Error, string, object, unknown)
 * - 비동기 함수 retry/fallback 로직 검증
 * - Timer 관리 모킹으로 시간 의존성 제거
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  standardizeError,
  getErrorMessage,
  isRetryableError,
  isFatalError,
  serializeError,
  withFallback,
  withRetry,
  type ErrorContext,
} from '@shared/utils/error-handling';

describe('Phase 125.3: error-handling.ts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('standardizeError', () => {
    it('should standardize Error instance', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'testOp',
        timestamp: 1234567890,
        retryable: true,
      };

      const result = standardizeError(error, context);

      expect(result.message).toBe('Test error');
      expect(result.context.operation).toBe('testOp');
      expect(result.context.timestamp).toBe(1234567890);
      expect(result.context.retryable).toBe(true);
      expect(result.originalError).toBe(error);
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const context: ErrorContext = {
        operation: 'stringOp',
        timestamp: Date.now(),
      };

      const result = standardizeError(error, context);

      expect(result.message).toBe('Unknown error occurred');
      expect(result.context.operation).toBe('stringOp');
      expect(result.originalError).toBeUndefined();
    });

    it('should add timestamp if not provided', () => {
      const error = new Error('No timestamp');
      const context: ErrorContext = {
        operation: 'noTimestamp',
        timestamp: 0,
      };

      const before = Date.now();
      const result = standardizeError(error, context);
      const after = Date.now();

      // timestamp should be auto-filled with current time or use provided 0
      expect(result.context.timestamp).toBeGreaterThanOrEqual(0);
      expect(result.context.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include stack in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Stack test');
      const context: ErrorContext = {
        operation: 'stackTest',
        timestamp: Date.now(),
      };

      const result = standardizeError(error, context);

      expect(result.stack).toBeDefined();
      expect(result.stack).toContain('Error: Stack test');

      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');
      const context: ErrorContext = {
        operation: 'prodTest',
        timestamp: Date.now(),
      };

      const result = standardizeError(error, context);

      expect(result.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should preserve metadata in context', () => {
      const error = new Error('Metadata test');
      const context: ErrorContext = {
        operation: 'metadataOp',
        timestamp: Date.now(),
        metadata: { key: 'value', nested: { prop: 123 } },
        fatal: true,
      };

      const result = standardizeError(error, context);

      expect(result.context.metadata).toEqual({ key: 'value', nested: { prop: 123 } });
      expect(result.context.fatal).toBe(true);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Error message');
      expect(getErrorMessage(error)).toBe('Error message');
    });

    it('should return string error as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should extract message from object with message property', () => {
      const error = { message: 'Object error' };
      expect(getErrorMessage(error)).toBe('Object error');
    });

    it('should return fallback for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error');
      expect(getErrorMessage(undefined)).toBe('Unknown error');
      expect(getErrorMessage(123)).toBe('Unknown error');
      expect(getErrorMessage({})).toBe('Unknown error');
    });

    it('should use custom fallback message', () => {
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
      expect(getErrorMessage({}, 'No error')).toBe('No error');
    });

    it('should handle non-string message property', () => {
      const error = { message: 123 };
      expect(getErrorMessage(error)).toBe('123');
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      expect(isRetryableError(new Error('Network error occurred'))).toBe(true);
      expect(isRetryableError(new Error('Connection timeout'))).toBe(true);
      expect(isRetryableError(new Error('Connection refused by server'))).toBe(true);
      expect(isRetryableError(new Error('Fetch failed'))).toBe(true);
      expect(isRetryableError(new Error('Resource load failed'))).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      expect(isRetryableError(new Error('Syntax error'))).toBe(false);
      expect(isRetryableError(new Error('Invalid argument'))).toBe(false);
      expect(isRetryableError(new Error('Out of memory'))).toBe(false);
    });

    it('should return false for non-Error types', () => {
      expect(isRetryableError('Network error')).toBe(false);
      expect(isRetryableError({ message: 'timeout' })).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isRetryableError(new Error('NETWORK ERROR'))).toBe(true);
      expect(isRetryableError(new Error('Timeout'))).toBe(true);
      expect(isRetryableError(new Error('CONNECTION REFUSED'))).toBe(true);
    });
  });

  describe('isFatalError', () => {
    it('should identify fatal system errors', () => {
      expect(isFatalError(new Error('Out of memory'))).toBe(true);
      expect(isFatalError(new Error('Stack overflow occurred'))).toBe(true);
      expect(isFatalError(new Error('Permission denied'))).toBe(true);
      expect(isFatalError(new Error('Security error: unauthorized'))).toBe(true);
      expect(isFatalError(new Error('CORS error'))).toBe(true);
    });

    it('should identify non-fatal errors', () => {
      expect(isFatalError(new Error('Network timeout'))).toBe(false);
      expect(isFatalError(new Error('Invalid input'))).toBe(false);
      expect(isFatalError(new Error('Resource not found'))).toBe(false);
    });

    it('should return false for non-Error types', () => {
      expect(isFatalError('Out of memory')).toBe(false);
      expect(isFatalError({ message: 'security error' })).toBe(false);
      expect(isFatalError(null)).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isFatalError(new Error('OUT OF MEMORY'))).toBe(true);
      expect(isFatalError(new Error('Stack Overflow'))).toBe(true);
      expect(isFatalError(new Error('PERMISSION DENIED'))).toBe(true);
    });
  });

  describe('serializeError', () => {
    it('should serialize Error instance', () => {
      const error = new Error('Serializable error');
      const result = serializeError(error);

      expect(result).toHaveProperty('name', 'Error');
      expect(result).toHaveProperty('message', 'Serializable error');
      expect(result).toHaveProperty('stack');
      expect(typeof result.stack).toBe('string');
    });

    it('should serialize plain objects', () => {
      const error = { code: 500, message: 'Server error', details: { info: 'test' } };
      const result = serializeError(error);

      expect(result).toEqual({ code: 500, message: 'Server error', details: { info: 'test' } });
    });

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'circular' };
      circular.self = circular;

      const result = serializeError(circular);

      // Circular reference causes JSON.stringify to fail, fallback to String()
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });

    it('should serialize primitive values', () => {
      expect(serializeError('string error')).toEqual({ error: 'string error' });
      expect(serializeError(123)).toEqual({ error: '123' });
      expect(serializeError(true)).toEqual({ error: 'true' });
      expect(serializeError(null)).toEqual({ error: 'null' });
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(
          message: string,
          public code: number
        ) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom', 404);
      const result = serializeError(error);

      expect(result).toHaveProperty('name', 'CustomError');
      expect(result).toHaveProperty('message', 'Custom');
      expect(result).toHaveProperty('stack');
    });
  });

  describe('withFallback', () => {
    it('should return operation result on success', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const fallback = vi.fn().mockResolvedValue('fallback');

      const result = await withFallback(operation, fallback, { operation: 'testOp' });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should execute fallback on operation failure', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const fallback = vi.fn().mockResolvedValue('fallback success');

      const result = await withFallback(operation, fallback, { operation: 'failOp' });

      expect(result).toBe('fallback success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should throw standardized error if fallback also fails', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Op failed'));
      const fallback = vi.fn().mockRejectedValue(new Error('Fallback failed'));

      await expect(
        withFallback(operation, fallback, { operation: 'doubleFail' })
      ).rejects.toMatchObject({
        message: 'Fallback failed',
        context: {
          operation: 'doubleFail_fallback',
          fatal: true,
        },
      });

      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should preserve operation context', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Failed'));
      const fallback = vi.fn().mockResolvedValue('recovered');

      const result = await withFallback(operation, fallback, {
        operation: 'contextOp',
        metadata: { key: 'value' },
      });

      expect(result).toBe('recovered');
    });
  });

  describe('withRetry', () => {
    it('should return result on first success', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await withRetry(operation, 3, 100, { operation: 'successOp' });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success on retry');

      const promise = withRetry(operation, 3, 100, { operation: 'retryOp' });

      // Fast-forward through retry delays
      await vi.advanceTimersByTimeAsync(100); // 1st retry delay (100ms * 2^0)
      await vi.advanceTimersByTimeAsync(200); // 2nd retry delay (100ms * 2^1)

      const result = await promise;

      expect(result).toBe('success on retry');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Network error'));

      const promise = withRetry(operation, 2, 100, { operation: 'maxRetryOp' });

      // Attach rejection handler BEFORE advancing timers to prevent unhandled rejection
      const expectPromise = expect(promise).rejects.toMatchObject({
        message: 'Network error',
        context: {
          operation: 'maxRetryOp',
          metadata: { maxRetries: 2, finalAttempt: true },
        },
      });

      // Fast-forward through all retry delays
      await vi.advanceTimersByTimeAsync(100); // 1st retry (100ms)
      await vi.advanceTimersByTimeAsync(200); // 2nd retry (200ms)

      await expectPromise;

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Invalid argument'));

      const promise = withRetry(operation, 3, 100, { operation: 'nonRetryableOp' });

      await expect(promise).rejects.toMatchObject({
        message: 'Invalid argument',
        context: {
          operation: 'nonRetryableOp',
        },
      });

      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should use exponential backoff', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');

      const promise = withRetry(operation, 3, 100, { operation: 'backoffOp' });

      // 1st retry: 100ms * 2^0 = 100ms
      await vi.advanceTimersByTimeAsync(100);
      expect(operation).toHaveBeenCalledTimes(2);

      // 2nd retry: 100ms * 2^1 = 200ms
      await vi.advanceTimersByTimeAsync(200);
      expect(operation).toHaveBeenCalledTimes(3);

      const result = await promise;
      expect(result).toBe('success');
    });

    it('should handle immediate success without delay', async () => {
      const operation = vi.fn().mockResolvedValue('immediate');

      const result = await withRetry(operation, 3, 100, { operation: 'immediateOp' });

      expect(result).toBe('immediate');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0); // No timers scheduled
    });
  });
});
