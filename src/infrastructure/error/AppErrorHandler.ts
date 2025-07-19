/**
 * 애플리케이션 에러 핸들러
 * Infrastructure Layer - 에러 처리 및 로깅
 */

import { logger } from '../logging';

/**
 * 에러 컨텍스트 타입
 */
interface ErrorContext {
  location: string;
  context: Record<string, unknown>;
  timestamp: number;
}

/**
 * 전역 에러 핸들러 클래스
 */
export class AppErrorHandler {
  private static instance: AppErrorHandler | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AppErrorHandler {
    AppErrorHandler.instance ??= new AppErrorHandler();
    return AppErrorHandler.instance;
  }

  /**
   * 에러 핸들러 초기화
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // 전역 에러 핸들링
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    this.isInitialized = true;
    logger.debug('AppErrorHandler: 전역 에러 핸들러 초기화됨');
  }

  /**
   * 전역 에러 처리
   */
  private handleGlobalError(event: ErrorEvent): void {
    const context: ErrorContext = {
      location: `${event.filename}:${event.lineno}:${event.colno}`,
      context: {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      },
      timestamp: Date.now(),
    };

    logger.error('전역 에러 발생:', event.error, context);
  }

  /**
   * 처리되지 않은 Promise 거부 처리
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const context: ErrorContext = {
      location: 'Promise rejection',
      context: {
        reason: event.reason,
      },
      timestamp: Date.now(),
    };

    logger.error('처리되지 않은 Promise 거부:', event.reason, context);

    // 기본 처리 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }

  /**
   * 정리
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    this.isInitialized = false;
    logger.debug('AppErrorHandler: 정리 완료');
  }
}
