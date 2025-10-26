/**
 * @fileoverview Global Error Handler Index
 * @version 2.1.0 - Phase 196: 전역 에러 처리만 제공
 *
 * @deprecated 애플리케이션 로직의 에러 처리는 @shared/utils/error-handling.ts 사용
 * 이 모듈은 Window 레벨의 에러만 처리 (uncaught errors, unhandled rejections)
 */

export { GlobalErrorHandler, AppErrorHandler, globalErrorHandler } from './error-handler';
