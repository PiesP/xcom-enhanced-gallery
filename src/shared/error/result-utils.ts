/**
 * TDD Phase 5b - Result Pattern 유틸리티
 * 성공/실패 상태를 명확히 관리하는 함수형 패턴
 */

import type { Result, ErrorState } from './types';

/**
 * 성공 Result 생성
 */
export const createSuccess = <T>(data: T): Result<T, never> => ({
  success: true as const,
  data,
});

/**
 * 실패 Result 생성
 */
export const createFailure = <E>(error: E): Result<never, E> => ({
  success: false as const,
  error,
});

/**
 * Result 타입 가드
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is { success: true; data: T } => {
  return result.success;
};

export const isFailure = <T, E>(result: Result<T, E>): result is { success: false; error: E } => {
  return !result.success;
};

/**
 * 기본 에러 처리 함수
 */
export const handleError = (error: Error, context?: string) => {
  return {
    handled: true,
    timestamp: new Date(),
    error: error.message,
    context: context || 'unknown',
  };
};

/**
 * 재시도 로직
 */
export const retryOperation = async <T>(
  operation: () => T | Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<Result<T, Error>> => {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await Promise.resolve(operation());
      return createSuccess(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return createFailure(lastError!);
};

/**
 * 에러 상태 생성
 */
export const createErrorState = (): ErrorState => ({
  hasError: false,
  error: null,
  retryCount: 0,
});

/**
 * 에러 상태 업데이트
 */
export const updateErrorState = (state: ErrorState, error: Error): ErrorState => ({
  ...state,
  hasError: true,
  error,
  retryCount: state.retryCount + 1,
});

/**
 * 구체적인 에러 생성자들
 */
export const createValidationError = (field: string, message: string) => ({
  type: 'validation' as const,
  field,
  message,
});

export const createNetworkError = (status: number, message: string) => ({
  type: 'network' as const,
  status,
  message,
});

export const createSystemError = (code: string, message: string) => ({
  type: 'system' as const,
  code,
  message,
});

/**
 * Promise를 Result로 래핑
 */
export const wrapPromise = async <T>(promise: Promise<T>): Promise<Result<T, Error>> => {
  try {
    const data = await promise;
    return createSuccess(data);
  } catch (error) {
    return createFailure(error as Error);
  }
};

/**
 * Result 체이닝 (map)
 */
export const mapResult = <T, U, E>(result: Result<T, E>, mapper: (data: T) => U): Result<U, E> => {
  if (isSuccess(result)) {
    return createSuccess(mapper(result.data));
  }
  return result;
};

/**
 * Result 체이닝 (flatMap)
 */
export const flatMapResult = <T, U, E>(
  result: Result<T, E>,
  mapper: (data: T) => Result<U, E>
): Result<U, E> => {
  if (isSuccess(result)) {
    return mapper(result.data);
  }
  return result;
};
