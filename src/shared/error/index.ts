/**
 * @fileoverview Core Error Handler Index
 * @version 2.0.0
 *
 * 통합 에러 처리 시스템의 진입점
 * Infrastructure AppErrorHandler 호환성 포함
 * TDD Phase 5b - Error Handling Consolidation
 */

// TDD Phase 5b - 새로운 에러 처리 시스템 (명시적 export)
export type {
  Result,
  AsyncResult,
  ErrorLevel,
  LogEntry,
  ErrorState,
  ValidationError,
  NetworkError,
  SystemError,
  AppError,
} from './types';

export {
  createSuccess,
  createFailure,
  isSuccess,
  isFailure,
  retryOperation,
  createErrorState,
  updateErrorState,
  createValidationError,
  createNetworkError,
  createSystemError,
  wrapPromise,
  mapResult,
  flatMapResult,
} from './result-utils';

export { ErrorLogger, AsyncErrorLogger } from './ErrorLogger';
export { ErrorBoundary } from '../components/error/ErrorBoundary';

// 기존 에러 핸들러 (하위 호환성 - 별칭으로 export)
export { AppErrorHandler as LegacyAppErrorHandler, safeAsync } from './error-handler';
