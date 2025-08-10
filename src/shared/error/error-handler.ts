/**
 * @fileoverview Error Handling System
 * @version 2.0.0
 *
 * Clean Architecture error handling system
 * Provides consistent error handling patterns across all layers
 */

import { logger } from '@shared/logging';

// ================================
// Core Error Types
// ================================

export enum ErrorCode {
  // System Errors (1000~1999)
  SYSTEM_ERROR = 1000,
  INITIALIZATION_ERROR = 1001,
  CONFIGURATION_ERROR = 1002,

  // Service Errors (2000~2999)
  SERVICE_UNAVAILABLE = 2000,
  SERVICE_TIMEOUT = 2001,
  DEPENDENCY_ERROR = 2002,

  // Media Errors (3000~3999)
  MEDIA_EXTRACTION_ERROR = 3000,
  MEDIA_DOWNLOAD_ERROR = 3001,
  MEDIA_PROCESSING_ERROR = 3002,

  // Network Errors (4000~4999)
  NETWORK_ERROR = 4000,
  HTTP_ERROR = 4001,
  CORS_ERROR = 4002,

  // Validation Errors (5000~5999)
  VALIDATION_ERROR = 5000,
  INVALID_INPUT = 5001,
  MISSING_PARAMETER = 5002,
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * 표준화된 애플리케이션 에러 클래스
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, unknown> | undefined;
  public readonly timestamp: number;
  public override readonly stack?: string;

  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = Date.now();

    if (originalError?.stack) {
      this.stack = originalError.stack;
    }
  }
}

// ================================
// Error Handler Interface
// ================================

export interface ErrorHandlerInterface {
  handle(error: Error | AppError, context?: string): void;
  handleAsync(error: Error | AppError, context?: string): Promise<void>;
}

/**
 * 에러 핸들러 구현
 */
export class ErrorHandler implements ErrorHandlerInterface {
  private static instance: ErrorHandler | null = null;
  private isGlobalHandlerInitialized = false;

  public static getInstance(): ErrorHandler {
    this.instance ??= new ErrorHandler();
    return this.instance;
  }

  private constructor() {}

  /**
   * 전역 에러 핸들러 초기화
   */
  public initializeGlobalHandlers(): void {
    if (this.isGlobalHandlerInitialized) {
      logger.debug('[ErrorHandler] Global handlers already initialized');
      return;
    }

    // 전역 에러 핸들링
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    this.isGlobalHandlerInitialized = true;
    logger.debug('[ErrorHandler] Global error handlers initialized');
  }

  /**
   * 전역 에러 핸들러 정리
   */
  public destroyGlobalHandlers(): void {
    if (!this.isGlobalHandlerInitialized) {
      return;
    }

    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    this.isGlobalHandlerInitialized = false;
    logger.debug('[ErrorHandler] Global error handlers destroyed');
  }

  /**
   * 전역 에러 처리
   */
  private handleGlobalError(event: ErrorEvent): void {
    const context = {
      location: `${event.filename}:${event.lineno}:${event.colno}`,
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: Date.now(),
    };

    const error = new AppError(
      ErrorCode.SYSTEM_ERROR,
      event.message || 'Global error occurred',
      ErrorSeverity.HIGH,
      context,
      event.error
    );

    this.handle(error, 'GlobalError');
  }

  /**
   * 처리되지 않은 Promise 거부 처리
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const context = {
      reason: event.reason,
      timestamp: Date.now(),
    };

    const error = new AppError(
      ErrorCode.SYSTEM_ERROR,
      `Unhandled promise rejection: ${String(event.reason)}`,
      ErrorSeverity.HIGH,
      context,
      event.reason instanceof Error ? event.reason : undefined
    );

    this.handle(error, 'UnhandledPromiseRejection');

    // 기본 처리 방지 (개발 모드에서만)
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  }

  /**
   * 동기적 에러 처리
   */
  public handle(error: Error | AppError, context = 'Unknown'): void {
    const normalizedError = this.normalizeError(error);
    this.logError(normalizedError, context);
    this.reportError(normalizedError, context);
  }

  /**
   * 비동기적 에러 처리
   */
  public async handleAsync(error: Error | AppError, context = 'Unknown'): Promise<void> {
    const normalizedError = this.normalizeError(error);
    this.logError(normalizedError, context);
    await this.reportErrorAsync(normalizedError, context);
  }

  /**
   * 에러를 AppError로 정규화
   */
  private normalizeError(error: Error | AppError): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // 일반 Error를 AppError로 변환
    return new AppError(
      ErrorCode.SYSTEM_ERROR,
      error.message,
      ErrorSeverity.MEDIUM,
      { originalName: error.name },
      error
    );
  }

  /**
   * 에러 로깅
   */
  private logError(error: AppError, context: string): void {
    const logData = {
      code: error.code,
      severity: error.severity,
      context,
      message: error.message,
      timestamp: error.timestamp,
      ...(error.context && { errorContext: error.context }),
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info(`[Error] ${context}:`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`[Error] ${context}:`, logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error(`[Error] ${context}:`, logData);
        break;
    }
  }

  /**
   * 동기적 에러 리포팅 (필요시 확장)
   */
  private reportError(error: AppError, context: string): void {
    // 향후 에러 리포팅 서비스 연동 시 구현
    if (error.severity === ErrorSeverity.CRITICAL) {
      console.error(`🚨 Critical Error in ${context}:`, error);
    }
  }

  /**
   * 비동기적 에러 리포팅 (필요시 확장)
   */
  private async reportErrorAsync(error: AppError, context: string): Promise<void> {
    // 향후 원격 에러 리포팅 서비스 연동 시 구현
    await Promise.resolve();
    this.reportError(error, context);
  }
}

// ================================
// Convenience Functions
// ================================

const errorHandler = ErrorHandler.getInstance();

/**
 * 안전한 비동기 함수 실행 래퍼
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context?: string,
  defaultValue?: T
): Promise<{ success: boolean; data?: T; error?: Error }> {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (context) {
      await errorHandler.handleAsync(err, context);
    }
    return {
      success: false,
      error: err,
      ...(defaultValue !== undefined && { data: defaultValue }),
    };
  }
}

/**
 * 안전한 동기 함수 실행 래퍼
 */
export function safeSync<T>(operation: () => T, context: string, defaultValue?: T): T | undefined {
  try {
    return operation();
  } catch (error) {
    errorHandler.handle(error as Error, context);
    return defaultValue;
  }
}

/**
 * 에러 생성 헬퍼 함수들
 */
export const createError = {
  system: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.SYSTEM_ERROR, message, ErrorSeverity.HIGH, context),

  service: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.SERVICE_UNAVAILABLE, message, ErrorSeverity.MEDIUM, context),

  media: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.MEDIA_EXTRACTION_ERROR, message, ErrorSeverity.MEDIUM, context),

  network: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.NETWORK_ERROR, message, ErrorSeverity.MEDIUM, context),

  validation: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.VALIDATION_ERROR, message, ErrorSeverity.LOW, context),

  critical: (message: string, context?: Record<string, unknown>) =>
    new AppError(ErrorCode.SYSTEM_ERROR, message, ErrorSeverity.CRITICAL, context),
};

/**
 * 전역 에러 핸들러 인스턴스
 */
export const globalErrorHandler = errorHandler;

/**
 * AppErrorHandler 호환성 클래스 (Infrastructure 레이어 호환성)
 */
export class AppErrorHandler {
  private static instance: AppErrorHandler | null = null;
  private readonly errorHandler = ErrorHandler.getInstance();

  public static getInstance(): AppErrorHandler {
    this.instance ??= new AppErrorHandler();
    return this.instance;
  }

  private constructor() {}

  /**
   * 에러 핸들러 초기화
   */
  public initialize(): void {
    this.errorHandler.initializeGlobalHandlers();
  }

  /**
   * 정리
   */
  public destroy(): void {
    this.errorHandler.destroyGlobalHandlers();
  }

  /**
   * 에러 처리
   */
  public handleError(error: Error, context?: string): void {
    this.errorHandler.handle(error, context);
  }
}

/**
 * 편의 함수: 에러 처리
 */
export function handleError(error: Error | AppError, context?: string): void {
  errorHandler.handle(error, context);
}

/**
 * 편의 함수: 비동기 에러 처리
 */
export async function handleErrorAsync(error: Error | AppError, context?: string): Promise<void> {
  await errorHandler.handleAsync(error, context);
}

// 하위 호환성을 위한 별칭
export type IErrorHandler = ErrorHandlerInterface;
