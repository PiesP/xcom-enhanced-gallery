/**
 * @fileoverview Global Error Handler
 * @version 2.1.0 - Phase 196: 전역 에러 처리 전용
 *
 * Window error 및 unhandledrejection 이벤트를 처리하는 전역 핸들러.
 *
 * @note 애플리케이션 로직의 에러 처리는 @shared/utils/error-handling.ts 사용.
 * 이 모듈은 브라우저 글로벌 에러만 처리합니다.
 */

import { logger } from '@shared/logging';

/**
 * 전역 에러 핸들러 (싱글톤)
 * Window 레벨의 uncaught error 및 unhandled promise rejection 처리
 */
export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler | null = null;
  private isInitialized = false;
  private boundErrorListener: ((event: ErrorEvent) => void) | null = null;
  private boundRejectionListener: ((event: PromiseRejectionEvent) => void) | null = null;

  public static getInstance(): GlobalErrorHandler {
    if (!this.instance) {
      this.instance = new GlobalErrorHandler();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 전역 에러 핸들러 초기화
   * Window 이벤트 리스너 등록
   */
  public initialize(): void {
    if (this.isInitialized) {
      logger.debug('[GlobalErrorHandler] Already initialized');
      return;
    }

    // Bound listeners 생성 (removeEventListener에서 동일 참조 필요)
    if (!this.boundErrorListener) {
      this.boundErrorListener = this.handleUncaughtError.bind(this);
    }
    if (!this.boundRejectionListener) {
      this.boundRejectionListener = this.handleUnhandledRejection.bind(this);
    }

    // Window 이벤트 리스너 등록
    window.addEventListener('error', this.boundErrorListener);
    window.addEventListener('unhandledrejection', this.boundRejectionListener);

    this.isInitialized = true;
    logger.debug('[GlobalErrorHandler] Global error handlers registered');
  }

  /**
   * 전역 에러 핸들러 정리
   * Window 이벤트 리스너 제거
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    // 리스너 제거
    if (this.boundErrorListener) {
      window.removeEventListener('error', this.boundErrorListener);
    }
    if (this.boundRejectionListener) {
      window.removeEventListener('unhandledrejection', this.boundRejectionListener);
    }

    this.isInitialized = false;
    this.boundErrorListener = null;
    this.boundRejectionListener = null;
    logger.debug('[GlobalErrorHandler] Global error handlers unregistered');
  }

  /**
   * Uncaught 에러 처리
   * @private
   */
  private handleUncaughtError(event: ErrorEvent): void {
    const message = event.message || 'Unknown error occurred';
    const context = {
      location: `${event.filename}:${event.lineno}:${event.colno}`,
      type: 'uncaught-error',
    };

    logger.error(`[UncaughtError] ${message}`, context);

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }

  /**
   * Unhandled Promise Rejection 처리
   * @private
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : `Unhandled rejection: ${String(reason)}`;

    logger.error(`[UnhandledRejection] ${message}`, {
      type: 'unhandled-rejection',
      reason: typeof reason === 'object' ? reason : String(reason),
    });

    // 기본 동작 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }
}

/**
 * @deprecated AppErrorHandler는 GlobalErrorHandler로 변경됨
 * 호환성 유지를 위한 별칭
 */
export class AppErrorHandler {
  private static instance: AppErrorHandler | null = null;
  private readonly handler = GlobalErrorHandler.getInstance();

  public static getInstance(): AppErrorHandler {
    if (!this.instance) {
      this.instance = new AppErrorHandler();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * @deprecated initialize() 사용 권장
   */
  public initialize(): void {
    this.handler.initialize();
  }

  /**
   * @deprecated destroy() 사용 권장
   */
  public destroy(): void {
    this.handler.destroy();
  }
}

/**
 * 전역 에러 핸들러 인스턴스
 */
export const globalErrorHandler = GlobalErrorHandler.getInstance();
