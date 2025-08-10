/**
 * @fileoverview Error handling type definitions
 * @version 1.0.0
 *
 * TDD Phase 5b - Error Handling Consolidation
 */

/**
 * Result pattern for error handling
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Promise-based Result pattern
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Error severity levels
 */
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * 구조화된 로그 엔트리
 */
export interface LogEntry {
  timestamp: Date;
  level: ErrorLevel;
  message: string;
  context?: string;
  stack?: string;
  error?: Error;
} /**
 * 에러 상태 인터페이스
 */
export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * 구체적인 에러 타입들
 */
export type ValidationError = {
  type: 'validation';
  field: string;
  message: string;
};

export type NetworkError = {
  type: 'network';
  status: number;
  message: string;
};

export type SystemError = {
  type: 'system';
  code: string;
  message: string;
};

export type AppError = ValidationError | NetworkError | SystemError;
