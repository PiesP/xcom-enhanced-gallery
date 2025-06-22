/**
 * @fileoverview Unified Error Handling System
 * @version 2.0.0
 *
 * Clean Architecture 원칙에 따른 통합 에러 처리 시스템
 * 모든 레이어에서 일관된 에러 처리 패턴 제공
 */

import { logger } from '@infrastructure/logging/logger';

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

export interface ErrorHandler {
  handle(error: Error | AppError, context?: string): void;
  handleAsync(error: Error | AppError, context?: string): Promise<void>;
}

/**
 * 통합 에러 핸들러 구현
 */
export class UnifiedErrorHandler implements ErrorHandler {
  private static instance: UnifiedErrorHandler | null = null;

  public static getInstance(): UnifiedErrorHandler {
    this.instance ??= new UnifiedErrorHandler();
    return this.instance;
  }

  private constructor() {}

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

const errorHandler = UnifiedErrorHandler.getInstance();

/**
 * 안전한 비동기 함수 실행 래퍼
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    await errorHandler.handleAsync(error as Error, context);
    return defaultValue;
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
