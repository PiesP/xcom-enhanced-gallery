/**
 * @fileoverview Error Handling Utilities
 * @version 2.0.0 - Unified with Core layer
 *
 * Clean Architecture에 따라 Core 레이어의 통합 에러 핸들러 사용
 */

// Core 레이어의 통합 에러 핸들러 re-export
export { safeAsync, safeSync, handleError } from '../../core/error/UnifiedErrorHandler';

/**
 * 안전한 비동기 작업 결과 인터페이스
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
 * @deprecated safeAsync, safeSync from @core/error/UnifiedErrorHandler 사용 권장
 */
export class ErrorBoundary {
  // 모든 메서드는 Core 레이어의 통합 에러 핸들러로 대체됨
  // @deprecated - 직접 사용하지 말고 safeAsync, safeSync 사용
}
