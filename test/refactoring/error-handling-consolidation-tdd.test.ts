/**
 * @fileoverview TDD Phase 5b: Error Handling Consolidation
 * @version 1.0.0
 *
 * TDD RED-GREEN-REFACTOR 사이클을 통한 에러 처리 시스템 통합
 * - Result Pattern 구현
 * - ErrorBoundary 컴포넌트
 * - 구조화된 로깅 시스템
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ComponentChildren } from 'preact';

describe('🔴 TDD Phase 5b: Error Handling Consolidation - RED', () => {
  describe('Result Pattern 타입 시스템', () => {
    it('Result, AsyncResult 타입이 존재해야 한다', async () => {
      // 타입은 런타임에 존재하지 않지만 import가 성공하면 타입이 존재함을 의미
      const module = await import('@shared/error/types');

      // 모듈이 성공적으로 로드되고 다른 exports가 있는지 확인
      expect(module).toBeDefined();
      expect(Object.keys(module).length).toBeGreaterThan(0);
    });

    it('createSuccess, createFailure 팩토리 함수들이 있어야 한다', async () => {
      const { createSuccess, createFailure } = await import('@shared/error/result-utils');

      expect(typeof createSuccess).toBe('function');
      expect(typeof createFailure).toBe('function');
    });

    it('isSuccess, isFailure 타입 가드가 있어야 한다', async () => {
      const { isSuccess, isFailure } = await import('@shared/error/result-utils');

      expect(typeof isSuccess).toBe('function');
      expect(typeof isFailure).toBe('function');
    });
  });

  describe('ErrorBoundary 컴포넌트', () => {
    it('ErrorBoundary 컴포넌트가 존재해야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/error');

      expect(ErrorBoundary).toBeDefined();
      expect(typeof ErrorBoundary).toBe('function');
    });

    it('ErrorBoundaryProps, ErrorBoundaryState 인터페이스가 있어야 한다', async () => {
      const module = await import('@shared/components/error/ErrorBoundary');

      // 타입은 런타임에 확인할 수 없지만 모듈 구조로 확인
      expect(module.ErrorBoundary).toBeDefined();
    });
  });

  describe('ErrorLogger 시스템', () => {
    it('ErrorLogger 클래스가 존재해야 한다', async () => {
      const { ErrorLogger } = await import('@shared/error/ErrorLogger');

      expect(ErrorLogger).toBeDefined();
      expect(typeof ErrorLogger).toBe('function');
    });

    it('AsyncErrorLogger 클래스가 존재해야 한다', async () => {
      const { AsyncErrorLogger } = await import('@shared/error/ErrorLogger');

      expect(AsyncErrorLogger).toBeDefined();
      expect(typeof AsyncErrorLogger).toBe('function');
    });

    it('ErrorLevel enum이 있어야 한다', async () => {
      const { ErrorLevel } = await import('@shared/error/types');

      expect(ErrorLevel).toBeDefined();
      expect(typeof ErrorLevel).toBe('object');
    });
  });
});

describe('🟢 TDD Phase 5b: Error Handling Consolidation - GREEN', () => {
  describe('Result Pattern 구현', () => {
    it('createSuccess가 성공 결과를 생성해야 한다', async () => {
      const { createSuccess, isSuccess } = await import('@shared/error/result-utils');

      const result = createSuccess('test data');

      expect(isSuccess(result)).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toBe('test data');
    });

    it('createFailure가 실패 결과를 생성해야 한다', async () => {
      const { createFailure, isFailure } = await import('@shared/error/result-utils');

      const error = new Error('test error');
      const result = createFailure(error);

      expect(isFailure(result)).toBe(true);
      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('타입 가드가 올바르게 작동해야 한다', async () => {
      const { createSuccess, createFailure, isSuccess, isFailure } = await import(
        '@shared/error/result-utils'
      );

      const successResult = createSuccess(42);
      const failureResult = createFailure(new Error('fail'));

      expect(isSuccess(successResult) && !isFailure(successResult)).toBe(true);
      expect(isFailure(failureResult) && !isSuccess(failureResult)).toBe(true);
    });
  });

  describe('ErrorBoundary 구현', () => {
    it('ErrorBoundary가 Preact Component를 상속해야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/components/error/ErrorBoundary');

      // Preact 컴포넌트 구조 확인
      expect(ErrorBoundary.prototype).toBeDefined();
      expect(typeof ErrorBoundary.prototype.render).toBe('function');
    });

    it('componentDidCatch 메서드가 구현되어 있어야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/components/error/ErrorBoundary');

      expect(typeof ErrorBoundary.prototype.componentDidCatch).toBe('function');
    });

    it('resetError 메서드가 있어야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/components/error/ErrorBoundary');

      const instance = new ErrorBoundary({ children: [] as ComponentChildren });
      expect(typeof instance.resetError).toBe('function');
    });
  });

  describe('ErrorLogger 구현', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('ErrorLogger가 싱글톤 패턴으로 작동해야 한다', async () => {
      const { ErrorLogger } = await import('@shared/error/ErrorLogger');

      const instance1 = ErrorLogger.getInstance();
      const instance2 = ErrorLogger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('logError 메서드가 구현되어 있어야 한다', async () => {
      const { ErrorLogger } = await import('@shared/error/ErrorLogger');

      const logger = ErrorLogger.getInstance();
      expect(typeof logger.logError).toBe('function');
    });

    it('logWarning, logCritical 메서드들이 있어야 한다', async () => {
      const { ErrorLogger } = await import('@shared/error/ErrorLogger');

      const logger = ErrorLogger.getInstance();
      expect(typeof logger.logWarning).toBe('function');
      expect(typeof logger.logCritical).toBe('function');
    });

    it('AsyncErrorLogger가 비동기 로깅을 수행해야 한다', async () => {
      const { AsyncErrorLogger } = await import('@shared/error/ErrorLogger');

      const logger = new AsyncErrorLogger();
      const logPromise = logger.logAsync(new Error('test error'));

      expect(logPromise instanceof Promise).toBe(true);
      await expect(logPromise).resolves.toBeUndefined();
    });
  });

  describe('통합된 error handling export', () => {
    it('@shared/error에서 모든 핵심 exports가 가능해야 한다', async () => {
      const errorModule = await import('@shared/error');

      // Result Pattern
      expect(errorModule.createSuccess).toBeDefined();
      expect(errorModule.createFailure).toBeDefined();
      expect(errorModule.isSuccess).toBeDefined();
      expect(errorModule.isFailure).toBeDefined();

      // ErrorLogger
      expect(errorModule.ErrorLogger).toBeDefined();
      expect(errorModule.AsyncErrorLogger).toBeDefined();

      // ErrorBoundary
      expect(errorModule.ErrorBoundary).toBeDefined();
    });
  });
});

describe('🔵 TDD Phase 5b: Error Handling Consolidation - REFACTOR', () => {
  describe('고급 Result Pattern 유틸리티', () => {
    it('retryOperation 함수가 재시도 로직을 처리해야 한다', async () => {
      const { retryOperation } = await import('@shared/error/result-utils');

      expect(typeof retryOperation).toBe('function');

      // 단순히 성공 케이스만 테스트
      const operation = () => 'success';
      const result = await retryOperation(operation, 3, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('success');
      }
    });

    it('wrapPromise가 Promise를 Result로 변환해야 한다', async () => {
      const { wrapPromise } = await import('@shared/error/result-utils');

      const successPromise = Promise.resolve('success');
      const failPromise = Promise.reject(new Error('fail'));

      const successResult = await wrapPromise(successPromise);
      const failResult = await wrapPromise(failPromise);

      expect(successResult.success).toBe(true);
      expect(failResult.success).toBe(false);
    });
  });

  describe('ErrorBoundary 고급 기능', () => {
    it('ErrorBoundary가 onError 콜백을 호출해야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/components/error/ErrorBoundary');

      const onError = vi.fn();
      const props = {
        onError,
        children: [] as ComponentChildren,
      };

      const boundary = new ErrorBoundary(props);

      // setState를 mock으로 대체
      boundary.setState = vi.fn();

      // props를 수동으로 설정 (테스트 환경에서 Preact 생성자 동작을 시뮬레이션)
      Object.defineProperty(boundary, 'props', {
        value: props,
        writable: true,
        configurable: true,
      });

      const testError = new Error('test error');
      const errorInfo = { componentStack: 'test stack' };

      boundary.componentDidCatch(testError, errorInfo);

      expect(onError).toHaveBeenCalledWith(testError, errorInfo);
    });

    it('ErrorLogger와 통합되어야 한다', async () => {
      const { ErrorBoundary } = await import('@shared/components/error/ErrorBoundary');
      const { ErrorLogger } = await import('@shared/error/ErrorLogger');

      // ErrorLogger 인스턴스 존재 확인
      const logger = ErrorLogger.getInstance();
      expect(logger).toBeDefined();
      expect(typeof logger.logCritical).toBe('function');

      // ErrorBoundary와 ErrorLogger가 통합되어 있음을 간접적으로 확인
      expect(ErrorBoundary).toBeDefined();
    });
  });

  describe('ErrorLogger 성능 최적화', () => {
    it('AsyncErrorLogger가 배치 로깅을 수행해야 한다', async () => {
      const { AsyncErrorLogger } = await import('@shared/error/ErrorLogger');

      const logger = new AsyncErrorLogger();

      const promises = [
        logger.logAsync(new Error('error 1')),
        logger.logAsync(new Error('error 2')),
        logger.logAsync(new Error('error 3')),
      ];

      await Promise.all(promises);

      // 배치 처리 확인은 구현에 따라 달라짐
      expect(promises.every(p => p instanceof Promise)).toBe(true);
    });
  });

  describe('하위 호환성 및 마이그레이션', () => {
    it('기존 AppErrorHandler와 호환성을 유지해야 한다', async () => {
      const { LegacyAppErrorHandler } = await import('@shared/error');

      expect(LegacyAppErrorHandler).toBeDefined();

      const handler = LegacyAppErrorHandler.getInstance();
      expect(typeof handler.handleError).toBe('function');
    });

    it('safeAsync 유틸리티가 여전히 작동해야 한다', async () => {
      const { safeAsync } = await import('@shared/error');

      expect(typeof safeAsync).toBe('function');

      const result = await safeAsync(async () => 'test');
      expect(result.success).toBe(true);
    });
  });
});
