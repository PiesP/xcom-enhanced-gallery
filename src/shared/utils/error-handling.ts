/**
 * @fileoverview Error Handling Utilities
 * @version 1.0.0
 *
 * 일관된 에러 처리를 위한 유틸리티들
 */

import { logger } from '@infrastructure/logging/logger';

/**
 * 안전한 비동기 작업 결과 인터페이스
 */
export interface SafeOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * 안전한 비동기 작업 실행
 *
 * @param operation 실행할 비동기 작업
 * @param context 컨텍스트 정보 (로깅용)
 * @returns 작업 결과
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string
): Promise<SafeOperationResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn(`Safe operation failed in ${context}:`, err);
    return { success: false, error: err };
  }
}

/**
 * 안전한 동기 작업 실행
 *
 * @param operation 실행할 동기 작업
 * @param context 컨텍스트 정보 (로깅용)
 * @returns 작업 결과
 */
export function safeSync<T>(operation: () => T, context: string): SafeOperationResult<T> {
  try {
    const data = operation();
    return { success: true, data };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn(`Safe operation failed in ${context}:`, err);
    return { success: false, error: err };
  }
}

/**
 * 에러 바운더리 클래스
 */
export class ErrorBoundary {
  /**
   * 비동기 에러 핸들링
   *
   * @param operation 실행할 작업
   * @param context 컨텍스트 정보
   * @param fallback 실패 시 반환할 기본값
   * @returns 작업 결과 또는 기본값
   */
  public static async handleAsyncError<T>(
    operation: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T> {
    return operation().catch(error => {
      logger.error(`Error in ${context}:`, error);

      // 개발 모드에서만 상세 정보 표시
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Detailed error in ${context}:`, error);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    });
  }

  /**
   * 동기 에러 핸들링
   *
   * @param operation 실행할 작업
   * @param context 컨텍스트 정보
   * @param fallback 실패 시 반환할 기본값
   * @returns 작업 결과 또는 기본값
   */
  public static handleSyncError<T>(operation: () => T, context: string, fallback?: T): T {
    try {
      return operation();
    } catch (error) {
      logger.error(`Error in ${context}:`, error);

      // 개발 모드에서만 상세 정보 표시
      if (process.env.NODE_ENV === 'development') {
        logger.error(`Detailed error in ${context}:`, error);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      throw error;
    }
  }
}

/**
 * 재시도 가능한 작업 실행
 *
 * @param operation 실행할 작업
 * @param context 컨텍스트 정보
 * @param maxRetries 최대 재시도 횟수 (기본값: 3)
 * @param delay 재시도 간격 (ms, 기본값: 1000)
 * @returns 작업 결과
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        logger.error(`Failed after ${maxRetries} attempts in ${context}:`, lastError);
        throw lastError;
      }

      logger.warn(`Attempt ${attempt} failed in ${context}, retrying...`, lastError);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 이 지점에 도달하면 lastError가 정의되어 있음
  throw lastError ?? new Error('Unknown error occurred');
}
