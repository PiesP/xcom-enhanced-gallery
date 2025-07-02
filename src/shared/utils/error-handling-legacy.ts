/**
 * @fileoverview Error Handling Utilities
 * @version 2.0.0 - Unified with Core layer
 *
 * Clean Architecture에 따라 Core 레이어의 통합 에러 핸들러 사용
 */

import { logger } from '@infrastructure/logging/logger';

// Core 레이어의 통합 에러 핸들러 re-export
export { safeAsync, safeSync, handleError } from '@core/error/UnifiedErrorHandler';

/**
 * 안전한 비동기 작업 결과 인터페이스
 * @deprecated Core 레이어의 Result 타입 사용 권장
 */
export interface SafeOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

/**
 * 에러 바운더리 클래스
 *
 * 레거시 호환성을 위해 유지되지만 Core 레이어의 에러 핸들링 사용 권장
 */
export class ErrorBoundary {
  /**
   * 비동기 에러 핸들링
   * @deprecated safeAsync from @core/error/UnifiedErrorHandler 사용 권장
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
   * @deprecated safeSync from @core/error/UnifiedErrorHandler 사용 권장
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
