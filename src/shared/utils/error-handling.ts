/**
 * @fileoverview 통합 에러 처리 유틸리티
 * @description Phase C: 프로젝트 전반의 에러 처리 표준화
 * @version 1.0.0
 */

import { globalTimerManager } from './timer-management';
import { logger } from '../logging';

/**
 * 에러 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low', // 무시해도 되는 에러
  MEDIUM = 'medium', // 기능 저하
  HIGH = 'high', // 기능 불가능
  CRITICAL = 'critical', // 애플리케이션 불능
}

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  NETWORK = 'network', // 네트워크 관련
  VALIDATION = 'validation', // 데이터 검증 실패
  PROCESSING = 'processing', // 데이터 처리 실패
  SYSTEM = 'system', // 시스템 에러
  UNKNOWN = 'unknown', // 분류 불가능
}

/**
 * 에러 컨텍스트 정보
 */
export interface ErrorContext {
  /** 에러가 발생한 작업 */
  operation: string;
  /** 에러 발생 시점 */
  timestamp: number;
  /** 추가 컨텍스트 데이터 */
  metadata?: Record<string, unknown>;
  /** Retry possible flag */
  retryable?: boolean;
  /** 치명적 에러 여부 */
  fatal?: boolean;
  /** 에러 심각도 (Phase A5.4 추가) */
  severity?: ErrorSeverity;
  /** 에러 카테고리 (Phase A5.4 추가) */
  category?: ErrorCategory;
}

/**
 * 표준화된 에러 인터페이스 (Phase A5.4 확장)
 */
export interface StandardError {
  /** 에러 메시지 */
  message: string;
  /** 에러 컨텍스트 */
  context: ErrorContext;
  /** 원본 에러 (있는 경우) */
  originalError?: Error;
  /** 에러 스택 (개발 환경) */
  stack?: string;
  /** 에러 코드 (Phase A5.4 추가) */
  code?: string;
}

/**
 * 에러를 표준 형식으로 변환
 *
 * @param error - 변환할 에러
 * @param context - 에러 컨텍스트
 * @returns 표준화된 에러 객체
 *
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   const standardError = standardizeError(error, {
 *     operation: 'galleryLoad',
 *     timestamp: Date.now(),
 *     retryable: true
 *   });
 *   logger.error(standardError);
 * }
 * ```
 */
export function standardizeError(error: unknown, context: ErrorContext): StandardError {
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    message,
    context: {
      ...context,
      timestamp: context.timestamp || Date.now(),
    },
    originalError: error instanceof Error ? error : undefined,
    stack: process.env.NODE_ENV === 'development' ? stack : undefined,
  } as StandardError;
}

/**
 * 에러 메시지를 안전하게 추출
 *
 * @param error - 에러 객체
 * @param fallback - 기본 메시지 (기본값: 'Unknown error')
 * @returns 에러 메시지 문자열
 *
 * @example
 * ```typescript
 * const message = getErrorMessage(error, 'Gallery operation failed');
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

/**
 * Check if error is retryable
 *
 * @param error - 확인할 에러
 * @returns whether retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network related errors are retryable
    const retryableMessages = [
      'network error',
      'timeout',
      'connection refused',
      'fetch failed',
      'load failed',
    ];

    const message = error.message.toLowerCase();
    return retryableMessages.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * 치명적 에러인지 확인
 *
 * @param error - 확인할 에러
 * @returns 치명적 에러 여부
 */
export function isFatalError(error: unknown): boolean {
  if (error instanceof Error) {
    // 시스템 레벨 에러는 치명적
    const fatalMessages = [
      'out of memory',
      'stack overflow',
      'permission denied',
      'security error',
      'cors error',
    ];

    const message = error.message.toLowerCase();
    return fatalMessages.some(pattern => message.includes(pattern));
  }

  return false;
}

/**
 * 에러 로깅을 위한 안전한 직렬화
 *
 * @param error - 직렬화할 에러
 * @returns 직렬화 가능한 객체
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    try {
      return JSON.parse(JSON.stringify(error));
    } catch {
      return { error: String(error) };
    }
  }

  return { error: String(error) };
}

/**
 * Graceful degradation을 위한 fallback 실행
 *
 * @param operation - 실행할 작업
 * @param fallback - 실패 시 fallback 함수
 * @param context - 에러 컨텍스트
 * @returns 작업 결과 또는 fallback 결과
 */
export async function withFallback<T>(
  operation: () => Promise<T>,
  fallback: () => Promise<T>,
  context: Omit<ErrorContext, 'timestamp'>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const standardError = standardizeError(error, {
      ...context,
      timestamp: Date.now(),
      fatal: false,
    });

    // 로깅은 외부에서 처리하도록 에러를 다시 throw하지 않고 fallback 실행
    logger.warn('Operation failed, executing fallback:', standardError.message);

    try {
      return await fallback();
    } catch (fallbackError) {
      const fallbackStandardError = standardizeError(fallbackError, {
        operation: `${context.operation}_fallback`,
        timestamp: Date.now(),
        fatal: true,
      });

      logger.error('Fallback also failed:', fallbackStandardError.message);
      throw fallbackStandardError;
    }
  }
}

/**
 * Execute task with retry logic
 *
 * @param operation - 실행할 작업
 * @param maxRetries - maximum retries
 * @param delay - retry delay (ms)
 * @param context - 에러 컨텍스트
 * @returns 작업 결과
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context: Omit<ErrorContext, 'timestamp'>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxRetries) {
        break;
      }

      // 지수 백오프
      const retryDelay = delay * Math.pow(2, attempt);
      await new Promise<void>(resolve =>
        globalTimerManager.setTimeout(() => resolve(), retryDelay)
      );
    }
  }

  throw standardizeError(lastError, {
    ...context,
    timestamp: Date.now(),
    metadata: { maxRetries, finalAttempt: true },
  });
}

/**
 * Error Factory 파라미터 타입 (timestamp 선택사항)
 */
export type ErrorFactoryContext = Omit<ErrorContext, 'category' | 'severity' | 'timestamp'> & {
  timestamp?: number;
};

/**
 * Error Factory - Type-safe 에러 생성 (Phase A5.4 추가)
 *
 * @description 표준화된 에러를 생성하는 팩토리
 *
 * @example
 * ```typescript
 * const error = ErrorFactory.network('Failed to fetch media', {
 *   operation: 'mediaLoad',
 *   metadata: { url: 'https://...' },
 *   retryable: true
 * });
 * ```
 */
export const ErrorFactory = {
  /**
   * 네트워크 에러 생성
   */
  network(message: string, context: ErrorFactoryContext): StandardError {
    return standardizeError(new Error(message), {
      ...context,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      timestamp: context.timestamp ?? Date.now(),
    });
  },

  /**
   * 검증 에러 생성
   */
  validation(message: string, context: ErrorFactoryContext): StandardError {
    return standardizeError(new Error(message), {
      ...context,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      timestamp: context.timestamp ?? Date.now(),
    });
  },

  /**
   * 처리 에러 생성
   */
  processing(message: string, context: ErrorFactoryContext): StandardError {
    return standardizeError(new Error(message), {
      ...context,
      category: ErrorCategory.PROCESSING,
      severity: ErrorSeverity.HIGH,
      timestamp: Date.now(),
    });
  },

  /**
   * 시스템 에러 생성
   */
  system(message: string, context: ErrorFactoryContext): StandardError {
    return standardizeError(new Error(message), {
      ...context,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      timestamp: context.timestamp ?? Date.now(),
      fatal: true,
    });
  },

  /**
   * 일반 에러 생성
   */
  generic(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorFactoryContext
  ): StandardError {
    return standardizeError(new Error(message), {
      ...context,
      category,
      severity,
      operation: context?.operation || 'unknown',
      timestamp: context?.timestamp ?? Date.now(),
    });
  },
};
