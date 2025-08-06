/**
 * Logger utility for X.com Enhanced Gallery
 *
 * 🔄 UPDATED: UnifiedLogger 기반으로 리팩토링됨
 * - console.error/warn 직접 사용 제거
 * - 통합 로깅 시스템 적용
 * - 성능 최적화 및 메모리 효율성 개선
 *
 * @fileoverview Centralized logging utility powered by UnifiedLogger
 * @version 2.0.0
 */

import { UnifiedLogger, LogLevel } from './unified-logger';

/**
 * Log levels for backward compatibility
 */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevelCompat = (typeof LOG_LEVELS)[number];

/**
 * Loggable data types - supports any serializable data including unknown types
 */
export type LoggableData =
  | string
  | number
  | boolean
  | Error
  | Record<string, unknown>
  | readonly unknown[]
  | unknown
  | null
  | undefined;

/**
 * Logger interface for consistent logging across the application
 */
export interface Logger {
  /** Log informational messages */
  info: (...args: LoggableData[]) => void;
  /** Log warning messages */
  warn: (...args: LoggableData[]) => void;
  /** Log error messages */
  error: (...args: LoggableData[]) => void;
  /** Log debug messages (development only) */
  debug: (...args: LoggableData[]) => void;
  /** Start performance timer */
  time: (label: string) => void;
  /** End performance timer */
  timeEnd: (label: string) => void;
}

/**
 * UnifiedLogger 기반 Logger 구현
 */
class UnifiedLoggerAdapter implements Logger {
  private readonly unifiedLogger = UnifiedLogger.getInstance();
  private readonly timers: Map<string, number> = new Map();

  info(...args: LoggableData[]): void {
    const message = this.formatArgs(args);
    this.unifiedLogger.info(message, { module: 'XEG' });
  }

  warn(...args: LoggableData[]): void {
    const message = this.formatArgs(args);
    this.unifiedLogger.warn(message, { module: 'XEG' });
  }

  error(...args: LoggableData[]): void {
    const message = this.formatArgs(args);
    this.unifiedLogger.error(message, { module: 'XEG' });
  }

  debug(...args: LoggableData[]): void {
    const message = this.formatArgs(args);
    this.unifiedLogger.debug(message, { module: 'XEG' });
  }

  time(label: string): void {
    this.timers.set(label, performance.now());
    this.debug(`Timer started: ${label}`);
  }

  timeEnd(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.info(`Timer ${label}: ${duration.toFixed(2)}ms`);
      this.timers.delete(label);
    } else {
      this.warn(`Timer ${label} was not started`);
    }
  }

  private formatArgs(args: LoggableData[]): string {
    return args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');
  }
}

/**
 * 기본 logger 인스턴스 - UnifiedLogger 기반
 */
export const logger: Logger = new UnifiedLoggerAdapter();

/**
 * 직접 UnifiedLogger 인스턴스 접근
 */
export const unifiedLogger = UnifiedLogger.getInstance();

/**
 * 호환성을 위한 개별 로깅 함수들
 */
export const logError = (...args: LoggableData[]): void => logger.error(...args);
export const logWarning = (...args: LoggableData[]): void => logger.warn(...args);
export const logInfo = (...args: LoggableData[]): void => logger.info(...args);
export const logDebug = (...args: LoggableData[]): void => logger.debug(...args);

/**
 * 로그 레벨 설정 (UnifiedLogger 기반)
 */
export const setLogLevel = (level: LogLevelCompat): void => {
  const unifiedLevel = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
  }[level];

  UnifiedLogger.getInstance().setLevel(unifiedLevel);
};

/**
 * Creates a scoped logger with a specific prefix.
 */
export function createScopedLogger(scope: string): Logger {
  class ScopedLoggerAdapter implements Logger {
    private readonly unifiedLogger = UnifiedLogger.getInstance();
    private readonly timers: Map<string, number> = new Map();

    info(...args: LoggableData[]): void {
      const message = this.formatArgs(args);
      this.unifiedLogger.info(message, { module: 'XEG', scope });
    }

    warn(...args: LoggableData[]): void {
      const message = this.formatArgs(args);
      this.unifiedLogger.warn(message, { module: 'XEG', scope });
    }

    error(...args: LoggableData[]): void {
      const message = this.formatArgs(args);
      this.unifiedLogger.error(message, { module: 'XEG', scope });
    }

    debug(...args: LoggableData[]): void {
      const message = this.formatArgs(args);
      this.unifiedLogger.debug(message, { module: 'XEG', scope });
    }

    time(label: string): void {
      this.timers.set(label, performance.now());
      this.debug(`Timer started: ${label}`);
    }

    timeEnd(label: string): void {
      const startTime = this.timers.get(label);
      if (startTime !== undefined) {
        const duration = performance.now() - startTime;
        this.info(`Timer ${label}: ${duration.toFixed(2)}ms`);
        this.timers.delete(label);
      } else {
        this.warn(`Timer ${label} was not started`);
      }
    }

    private formatArgs(args: LoggableData[]): string {
      return args
        .map(arg => {
          if (typeof arg === 'string') return arg;
          if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
          if (typeof arg === 'object' && arg !== null) {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');
    }
  }

  return new ScopedLoggerAdapter();
}

/**
 * Performance measurement with logging
 */
export async function measurePerformanceWithLog<T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> {
  logger.time(label);
  try {
    const result = await fn();
    return result;
  } finally {
    logger.timeEnd(label);
  }
}

/**
 * 하위 호환성을 위한 기본 export
 */
export default logger;
