/**
 * @fileoverview Error Handling Utilities
 * @version 2.0.0 - Integrated with Core layer
 *
 * Clean Architecture에 따라 Core 레이어의 통합 에러 핸들러 사용
 */

// Core 레이어의 통합 에러 핸들러 re-export
export { safeAsync, safeSync, handleError } from '../../core/error/ErrorHandler';

/**
 * 안전한 비동기 작업 결과 인터페이스
 */
export interface SafeOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
