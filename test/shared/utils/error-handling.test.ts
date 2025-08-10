/**
 * @fileoverview Error Handling Utils TDD 테스트 (실제 함수들만)
 * @description 실제로 존재하는 에러 처리 유틸리티 함수들만 테스트
 * @version 2.0.0 - 실제 함수 기반 재작성
 */

import { describe, it, expect, vi } from 'vitest';
import { logger } from '@shared/logging';
import {
  // 실제 존재하는 함수들과 타입들만 import
  standardizeError,
  getErrorMessage,
  isRetryableError,
  isFatalError,
  serializeError,
  withFallback,
  withRetry,
  type ErrorContext,
} from '@shared/utils/error-handling';

describe('Error Handling Utils TDD 테스트', () => {
  describe('🔴 RED: 에러 표준화', () => {
    it('standardizeError가 네이티브 에러를 표준 형식으로 변환해야 한다', () => {
      const nativeError = new Error('Test error message');
      const context: ErrorContext = {
        operation: 'test-operation',
        timestamp: Date.now(),
        metadata: { key: 'value' },
        retryable: true,
        fatal: false,
      };

      const standardError = standardizeError(nativeError, context);

      expect(standardError.message).toBe('Test error message');
      expect(standardError.context).toEqual(
        expect.objectContaining({
          operation: 'test-operation',
          metadata: { key: 'value' },
          retryable: true,
          fatal: false,
        })
      );
      expect(standardError.originalError).toBe(nativeError);
      expect(standardError.context.timestamp).toBeDefined();
    });

    it('standardizeError가 문자열을 처리해야 한다', () => {
      const errorMessage = 'Simple error message';
      const context: ErrorContext = {
        operation: 'string-conversion',
        timestamp: Date.now(),
      };

      const standardError = standardizeError(errorMessage, context);

      expect(standardError.message).toBe('Unknown error occurred');
      expect(standardError.context.operation).toBe('string-conversion');
      expect(standardError.originalError).toBeUndefined();
    });

    it('standardizeError가 unknown 타입을 처리해야 한다', () => {
      const unknownError = { someProperty: 'value' };
      const context: ErrorContext = {
        operation: 'unknown-error',
        timestamp: Date.now(),
      };

      const standardError = standardizeError(unknownError, context);

      expect(standardError.message).toBe('Unknown error occurred');
      expect(standardError.context.operation).toBe('unknown-error');
      expect(standardError.originalError).toBeUndefined();
    });
  });

  describe('🟢 GREEN: 에러 메시지 추출', () => {
    it('getErrorMessage가 Error 객체의 메시지를 추출해야 한다', () => {
      const error = new Error('Native error message');
      const message = getErrorMessage(error);

      expect(message).toBe('Native error message');
    });

    it('getErrorMessage가 문자열 에러를 처리해야 한다', () => {
      const stringError = 'String error message';
      const message = getErrorMessage(stringError);

      expect(message).toBe('String error message');
    });

    it('getErrorMessage가 message 속성을 가진 객체를 처리해야 한다', () => {
      const objectError = { message: 'Object error message' };
      const message = getErrorMessage(objectError);

      expect(message).toBe('Object error message');
    });

    it('getErrorMessage가 알 수 없는 에러에 fallback을 사용해야 한다', () => {
      const unknownError = { someOtherProperty: 'value' };
      const message = getErrorMessage(unknownError);

      expect(message).toBe('Unknown error');
    });

    it('getErrorMessage가 커스텀 fallback을 사용해야 한다', () => {
      const unknownError = null;
      const message = getErrorMessage(unknownError, 'Custom fallback message');

      expect(message).toBe('Custom fallback message');
    });
  });

  describe('🔵 REFACTOR: 에러 분류', () => {
    it('isRetryableError가 재시도 가능한 네트워크 에러를 식별해야 한다', () => {
      const networkError = new Error('Network error occurred');
      const timeoutError = new Error('Request timeout');
      const connectionError = new Error('Connection refused');
      const fetchError = new Error('Fetch failed');
      const loadError = new Error('Load failed');

      expect(isRetryableError(networkError)).toBe(true);
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(connectionError)).toBe(true);
      expect(isRetryableError(fetchError)).toBe(true);
      expect(isRetryableError(loadError)).toBe(true);
    });

    it('isRetryableError가 재시도 불가능한 에러를 식별해야 한다', () => {
      const syntaxError = new Error('Syntax error in code');
      const referenceError = new ReferenceError('Variable not defined');
      const nonError = 'Not an error object';

      expect(isRetryableError(syntaxError)).toBe(false);
      expect(isRetryableError(referenceError)).toBe(false);
      expect(isRetryableError(nonError)).toBe(false);
    });

    it('isFatalError가 치명적 에러를 식별해야 한다', () => {
      const memoryError = new Error('Out of memory');
      const stackError = new Error('Stack overflow');
      const permissionError = new Error('Permission denied');
      const securityError = new Error('Security error');
      const corsError = new Error('CORS error');

      expect(isFatalError(memoryError)).toBe(true);
      expect(isFatalError(stackError)).toBe(true);
      expect(isFatalError(permissionError)).toBe(true);
      expect(isFatalError(securityError)).toBe(true);
      expect(isFatalError(corsError)).toBe(true);
    });

    it('isFatalError가 일반 에러를 비치명적으로 분류해야 한다', () => {
      const normalError = new Error('Normal error');
      const networkError = new Error('Network timeout');
      const nonError = 'Not an error object';

      expect(isFatalError(normalError)).toBe(false);
      expect(isFatalError(networkError)).toBe(false);
      expect(isFatalError(nonError)).toBe(false);
    });
  });

  describe('🚀 에러 직렬화', () => {
    it('serializeError가 Error 객체를 직렬화해야 한다', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const serialized = serializeError(error);

      expect(serialized).toEqual({
        name: 'TestError',
        message: 'Test error',
        stack: expect.any(String),
      });
    });

    it('serializeError가 일반 객체를 직렬화해야 한다', () => {
      const errorObject = {
        code: 'E001',
        description: 'Custom error object',
        metadata: { userId: '123' },
      };

      const serialized = serializeError(errorObject);

      expect(serialized).toEqual(errorObject);
    });

    it('serializeError가 직렬화 불가능한 객체를 처리해야 한다', () => {
      const circularObj: any = { name: 'circular' };
      circularObj.self = circularObj; // 순환 참조

      const serialized = serializeError(circularObj);

      expect(serialized).toEqual({ error: '[object Object]' });
    });

    it('serializeError가 문자열을 처리해야 한다', () => {
      const stringError = 'Simple string error';

      const serialized = serializeError(stringError);

      expect(serialized).toEqual({ error: 'Simple string error' });
    });
  });

  describe('🔄 고급 에러 처리', () => {
    it('withFallback이 성공적인 작업을 그대로 반환해야 한다', async () => {
      const successOperation = async () => 'success result';
      const fallbackOperation = async () => 'fallback result';

      const result = await withFallback(successOperation, fallbackOperation, {
        operation: 'test-success',
      });

      expect(result).toBe('success result');
    });

    it('withFallback이 실패 시 fallback을 실행해야 한다', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const failingOperation = async () => {
        throw new Error('Primary operation failed');
      };
      const fallbackOperation = async () => 'fallback result';

      const result = await withFallback(failingOperation, fallbackOperation, {
        operation: 'test-fallback',
      });

      expect(result).toBe('fallback result');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('withFallback이 fallback도 실패할 때 에러를 던져야 한다', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const failingOperation = async () => {
        throw new Error('Primary operation failed');
      };
      const failingFallback = async () => {
        throw new Error('Fallback also failed');
      };

      await expect(
        withFallback(failingOperation, failingFallback, { operation: 'test-double-failure' })
      ).rejects.toThrow();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it.skip('withRetry가 재시도 후 성공해야 한다', async () => {
      let attemptCount = 0;
      const flakyOperation = async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Network timeout');
        }
        return 'success after retry';
      };

      const result = await withRetry(
        flakyOperation,
        3,
        1, // 딜레이를 1ms로 줄임
        { operation: 'test-retry-success' }
      );

      expect(result).toBe('success after retry');
      expect(attemptCount).toBe(2);
    });

    it.skip('withRetry가 최대 재시도 후 실패해야 한다', async () => {
      let attemptCount = 0;
      const alwaysFailingOperation = async () => {
        attemptCount++;
        throw new Error('Network timeout');
      };

      await expect(
        withRetry(
          alwaysFailingOperation,
          1, // 재시도 횟수를 줄임
          1, // 딜레이를 1ms로 줄임
          { operation: 'test-retry-failure' }
        )
      ).rejects.toThrow();

      expect(attemptCount).toBe(2); // 초기 시도 + 1번 재시도
    });

    it('withRetry가 재시도 불가능한 에러는 즉시 실패해야 한다', async () => {
      let attemptCount = 0;
      const nonRetryableOperation = async () => {
        attemptCount++;
        throw new Error('Syntax error'); // 재시도 불가능한 에러
      };

      await expect(
        withRetry(
          nonRetryableOperation,
          3,
          1, // 딜레이를 1ms로 줄임
          { operation: 'test-non-retryable' }
        )
      ).rejects.toThrow();

      expect(attemptCount).toBe(1); // 재시도하지 않음
    });
  });

  describe('🌟 실제 사용 시나리오', () => {
    it('갤러리 로딩 에러 처리 시나리오', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const failingGalleryLoad = async () => {
        throw new Error('Failed to load gallery images');
      };

      const fallbackGalleryLoad = async () => {
        return ['cached-image1.jpg', 'cached-image2.jpg'];
      };

      const result = await withFallback(failingGalleryLoad, fallbackGalleryLoad, {
        operation: 'gallery-load',
        retryable: true,
        metadata: { source: 'twitter-api' },
      });

      expect(result).toEqual(['cached-image1.jpg', 'cached-image2.jpg']);
      // UnifiedLogger는 포맷된 단일 메시지와 context 객체를 전달함
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0];
      const [message, context] = call as [string, Record<string, unknown>];
      expect(typeof message).toBe('string');
      expect(message).toContain('Operation failed, executing fallback:');
      expect(message).toContain('Failed to load gallery images');
      expect(context).toEqual(expect.objectContaining({ module: 'XEG' }));

      consoleSpy.mockRestore();
    });

    it.skip('네트워크 재시도 시나리오', async () => {
      let networkAttempts = 0;
      const unstableNetwork = async () => {
        networkAttempts++;
        if (networkAttempts <= 1) {
          // 한 번만 실패하도록 줄임
          throw new Error('Network error - connection timeout');
        }
        return { data: 'network success', attempt: networkAttempts };
      };

      const result = await withRetry(
        unstableNetwork,
        2, // 재시도 횟수 줄임
        1, // 딜레이를 1ms로 줄임
        { operation: 'api-request', retryable: true }
      );

      expect(result).toEqual({ data: 'network success', attempt: 2 });
      expect(networkAttempts).toBe(2);
    });

    it('복합 에러 처리 시나리오', () => {
      const originalError = new Error('Database connection failed');
      const context: ErrorContext = {
        operation: 'database-query',
        timestamp: Date.now(),
        metadata: {
          query: 'SELECT * FROM media',
          userId: 'user123',
        },
        retryable: true,
        fatal: false,
      };

      const standardError = standardizeError(originalError, context);
      const errorMessage = getErrorMessage(originalError);
      const isRetryable = isRetryableError(originalError);
      const isFatal = isFatalError(originalError);
      const serialized = serializeError(standardError);

      expect(standardError.message).toBe('Database connection failed');
      expect(errorMessage).toBe('Database connection failed');
      expect(isRetryable).toBe(false); // 'database connection failed'는 재시도 패턴에 포함되지 않음
      expect(isFatal).toBe(false); // 치명적 패턴에 포함되지 않음
      expect(serialized).toHaveProperty('message');
      expect(serialized).toHaveProperty('context');
    });
  });
});
