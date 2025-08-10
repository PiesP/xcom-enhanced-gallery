/**
 * TDD Phase 5b - ErrorLogger 서비스
 * 통합 에러 로깅 시스템 (싱글톤 패턴)
 */

import { ErrorLevel } from './types';
import type { LogEntry } from './types';

/**
 * 통합 에러 로거 - 싱글톤 패턴
 */
export class ErrorLogger {
  private static instance: ErrorLogger | null = null;
  private logs: LogEntry[] = [];

  private constructor() {
    // 싱글톤 패턴 - private constructor
  }

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * 에러 로그 추가
   */
  logError(error: Error, context?: { context?: string }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: ErrorLevel.ERROR,
      message: error.message,
      context: context?.context || 'unknown',
      error,
    };

    if (error.stack) {
      entry.stack = error.stack;
    }

    this.logs.push(entry);
  }

  /**
   * 경고 로그 추가
   */
  logWarning(error: Error, context?: { context?: string }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: ErrorLevel.WARNING,
      message: error.message,
      context: context?.context || 'unknown',
      error,
    };

    if (error.stack) {
      entry.stack = error.stack;
    }

    this.logs.push(entry);
  }

  /**
   * 치명적 에러 로그 추가
   */
  logCritical(error: Error, context?: { context?: string }): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: ErrorLevel.CRITICAL,
      message: error.message,
      context: context?.context || 'unknown',
      error,
    };

    if (error.stack) {
      entry.stack = error.stack;
    }

    this.logs.push(entry);
  }

  /**
   * 모든 로그 조회
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 레벨별 로그 조회
   */
  getLogsByLevel(level: ErrorLevel): LogEntry[] {
    return this.logs.filter(log => {
      if (level === 'critical') {
        return log.level === 'critical';
      }
      if (level === 'error') {
        return log.level === 'error' || log.level === 'critical';
      }
      return log.level === level;
    });
  }

  /**
   * 로그 초기화 (테스트용)
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * 인스턴스 리셋 (테스트용)
   */
  static resetInstance(): void {
    ErrorLogger.instance = null;
  }
}

/**
 * 비동기 에러 로거 - 성능 최적화용
 */
export class AsyncErrorLogger {
  public errorQueue: Array<{ error: Error; timestamp: Date }> = [];

  /**
   * 에러를 큐에 추가하고 비동기로 처리
   */
  logError(error: Error): void {
    this.errorQueue.push({ error, timestamp: new Date() });

    // 비동기로 처리
    Promise.resolve().then(() => {
      this.processErrorQueue();
    });
  }

  /**
   * 비동기 로깅 메서드 (테스트용)
   */
  logAsync(error: Error): Promise<void> {
    return new Promise<void>(resolve => {
      this.errorQueue.push({ error, timestamp: new Date() });

      // 즉시 처리하고 resolve
      Promise.resolve().then(() => {
        this.processErrorQueue();
        resolve();
      });
    });
  }

  /**
   * 큐 처리
   */
  processErrorQueue(): Array<{ error: Error; timestamp: Date }> {
    const errors = this.errorQueue.splice(0);
    // 실제로는 외부 서비스로 전송하지만, 테스트용으로 반환만
    return errors;
  }
}
