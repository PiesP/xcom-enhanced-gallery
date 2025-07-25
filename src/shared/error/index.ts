/**
 * @fileoverview Core Error Handler Index
 * @version 2.0.0
 *
 * 통합 에러 처리 시스템의 진입점
 * Infrastructure AppErrorHandler 호환성 포함
 */

export * from './ErrorHandler';

// Infrastructure 호환성 re-exports
export { AppErrorHandler, ErrorHandler as CoreErrorHandler } from './ErrorHandler';
