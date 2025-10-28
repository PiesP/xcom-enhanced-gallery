/**
 * Centralized logging infrastructure
 *
 * Provides consistent logging interface with different log levels and formatting.
 * All logs are prefixed with [XEG] for easy identification in browser console.
 *
 * Supports development and production modes with automatic tree-shaking for debug
 * code elimination in production builds via __DEV__ global.
 *
 * @fileoverview Centralized logging system
 * @version 1.2.0
 */

/**
 * Supported log levels with priority ordering
 *
 * @const {readonly string[]}
 * @public
 */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

/**
 * Log level type
 *
 * @public
 */
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Type representing any loggable data
 *
 * Supports primitives, errors, objects, arrays, and any serializable values.
 *
 * @public
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
 * Logger interface providing logging methods
 *
 * Defines the public API for logging at different levels with optional performance timing.
 *
 * @interface Logger
 * @public
 */
export interface Logger {
  /**
   * Log informational messages
   * @param {...LoggableData[]} args - Data to log
   */
  info: (...args: LoggableData[]) => void;

  /**
   * Log warning messages
   * @param {...LoggableData[]} args - Data to log
   */
  warn: (...args: LoggableData[]) => void;

  /**
   * Log error messages
   * @param {...LoggableData[]} args - Data to log
   */
  error: (...args: LoggableData[]) => void;

  /**
   * Log debug messages (development only)
   * @param {...LoggableData[]} args - Data to log
   */
  debug: (...args: LoggableData[]) => void;

  /**
   * Start a performance timer
   * @param {string} label - Timer identifier
   */
  time: (label: string) => void;

  /**
   * End a performance timer and log duration
   * @param {string} label - Timer identifier (must match previous time() call)
   */
  timeEnd: (label: string) => void;
}

interface LoggerConfig {
  readonly level: LogLevel;
  readonly prefix: string;
  readonly includeTimestamp: boolean;
  readonly includeStackTrace: boolean;
  readonly correlationId?: string;
}

const BASE_PREFIX = '[XEG]';
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const noop = (): void => {};
// Use __DEV__ global (defined in vite.config.ts) instead of import.meta.env.DEV
// to ensure proper tree-shaking in production builds
const isDev = __DEV__;
// Vitest 환경에서는 대량 로그 출력을 방지하여 EPIPE 에러 회피
// Vitest는 전역 describe/test/expect를 제공하므로 이를 통해 감지
const isTestEnv =
  typeof globalThis !== 'undefined' &&
  ('describe' in globalThis || 'test' in globalThis || 'expect' in globalThis);

type LoggerFactory = (config?: Partial<LoggerConfig>) => Logger;
type ScopedFactory = (scope: string, config?: Partial<LoggerConfig>) => Logger;
type ScopedCorrelationFactory = (
  scope: string,
  correlationId: string,
  config?: Partial<LoggerConfig>
) => Logger;

let createLoggerImpl: LoggerFactory;
let createScopedLoggerImpl: ScopedFactory;
let createScopedLoggerWithCorrelationImpl: ScopedCorrelationFactory;

if (isDev) {
  const getEnvironmentLogLevel = (): LogLevel => {
    // Vitest 환경에서는 에러만 출력 (EPIPE 방지)
    if (isTestEnv) {
      return 'error';
    }

    // Phase 137: Type Guard 기반 안전한 Userscript 환경 감지
    try {
      if (typeof window !== 'undefined') {
        const windowRecord = window as unknown as Record<string, unknown>;
        const gmInfo = windowRecord['GM_info'];
        const unsafeWin = windowRecord.unsafeWindow;
        if (gmInfo !== undefined || unsafeWin !== undefined) {
          return 'info';
        }
      }
    } catch {
      // ignore access errors
    }

    // 번들 정의 플래그만 사용하여 dead-code 제거를 극대화
    return isDev ? 'debug' : 'info';
  };

  const DEFAULT_CONFIG: LoggerConfig = {
    level: getEnvironmentLogLevel(),
    prefix: BASE_PREFIX,
    includeTimestamp: true,
    includeStackTrace: true,
  };

  const timerStorage: Record<string, number> = {};

  const formatMessage = (
    level: LogLevel,
    config: LoggerConfig,
    ...args: LoggableData[]
  ): LoggableData[] => {
    const timestamp = config.includeTimestamp ? `[${new Date().toISOString()}]` : '';
    const levelTag = `[${level.toUpperCase()}]`;
    const cid = config.correlationId ? `[cid:${String(config.correlationId)}]` : '';
    const prefixParts = [config.prefix, timestamp, levelTag, cid].filter(Boolean);
    return [prefixParts.join(' '), ...args];
  };

  const shouldLog = (level: LogLevel, config: LoggerConfig): boolean => {
    // Vitest 환경에서는 실행 시점에 동적으로 감지 (EPIPE 방지)
    // Vitest는 전역 describe/test/expect를 제공하므로 이를 통해 감지
    const isInTest =
      typeof globalThis !== 'undefined' &&
      ('describe' in globalThis || 'test' in globalThis || 'expect' in globalThis);

    if (isInTest) {
      // 테스트 환경에서는 에러만 출력
      return level === 'error';
    }

    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
  };

  createLoggerImpl = (config: Partial<LoggerConfig> = {}): Logger => {
    const finalConfig: LoggerConfig = { ...DEFAULT_CONFIG, ...config };

    return {
      info: (...args: LoggableData[]): void => {
        if (shouldLog('info', finalConfig)) {
          console.info(...formatMessage('info', finalConfig, ...args));
        }
      },
      warn: (...args: LoggableData[]): void => {
        if (shouldLog('warn', finalConfig)) {
          console.warn(...formatMessage('warn', finalConfig, ...args));
        }
      },
      error: (...args: LoggableData[]): void => {
        if (shouldLog('error', finalConfig)) {
          console.error(...formatMessage('error', finalConfig, ...args));

          if (finalConfig.includeStackTrace && args.length > 0) {
            const firstArg = args[0];
            if (firstArg instanceof Error && firstArg.stack) {
              console.error('Stack trace:', firstArg.stack);
            }
          }
        }
      },
      debug: (...args: LoggableData[]): void => {
        if (shouldLog('debug', finalConfig)) {
          console.info(...formatMessage('debug', finalConfig, ...args));
        }
      },
      time: (label: string): void => {
        if (shouldLog('debug', finalConfig)) {
          const timerKey = `__timer_${label}`;
          timerStorage[timerKey] = Date.now();
          console.info(...formatMessage('debug', finalConfig, `Timer started: ${label}`));
        }
      },
      timeEnd: (label: string): void => {
        if (shouldLog('debug', finalConfig)) {
          const timerKey = `__timer_${label}`;
          const startTime = timerStorage[timerKey];

          if (typeof startTime === 'number') {
            const duration = Date.now() - startTime;
            console.info(...formatMessage('debug', finalConfig, `${label}: ${duration}ms`));
            delete timerStorage[timerKey];
          } else {
            console.info(
              ...formatMessage('debug', finalConfig, `Timer '${label}' was not started`)
            );
          }
        }
      },
    };
  };

  createScopedLoggerImpl = (scope: string, config: Partial<LoggerConfig> = {}): Logger =>
    createLoggerImpl({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
    });

  createScopedLoggerWithCorrelationImpl = (
    scope: string,
    correlationId: string,
    config: Partial<LoggerConfig> = {}
  ): Logger =>
    createLoggerImpl({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
      correlationId,
    });
} else {
  const createProdLogger: LoggerFactory = (config: Partial<LoggerConfig> = {}): Logger => {
    const level = config.level ?? 'warn';
    const prefix = config.prefix ?? BASE_PREFIX;
    const correlation = config.correlationId ? `[cid:${String(config.correlationId)}]` : '';
    const baseLabel = correlation ? `${prefix} ${correlation}` : prefix;
    const threshold = LOG_LEVEL_PRIORITY[level] ?? LOG_LEVEL_PRIORITY.warn;

    const logWith =
      (targetLevel: LogLevel, method: 'info' | 'warn' | 'error') =>
      (...args: LoggableData[]): void => {
        if (LOG_LEVEL_PRIORITY[targetLevel] < threshold) {
          return;
        }

        if (method === 'info') {
          console.info(baseLabel, ...args);
        } else if (method === 'warn') {
          console.warn(baseLabel, ...args);
        } else {
          console.error(baseLabel, ...args);
        }
      };

    return {
      info: logWith('info', 'info'),
      warn: logWith('warn', 'warn'),
      error: logWith('error', 'error'),
      debug: noop,
      time: noop,
      timeEnd: noop,
    };
  };

  createLoggerImpl = createProdLogger;

  createScopedLoggerImpl = (scope: string, config: Partial<LoggerConfig> = {}): Logger =>
    createProdLogger({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
    });

  createScopedLoggerWithCorrelationImpl = (
    scope: string,
    correlationId: string,
    config: Partial<LoggerConfig> = {}
  ): Logger =>
    createProdLogger({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
      correlationId,
    });
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return createLoggerImpl(config);
}

/**
 * Global default logger instance
 *
 * Automatically configured for development (debug level with timestamps)
 * or production (warn level, minimal output).
 *
 * @const {Logger}
 * @public
 */
export const logger: Logger = createLogger({
  level: isDev ? 'debug' : 'warn',
  includeTimestamp: isDev,
  includeStackTrace: isDev,
});

/**
 * Creates a scoped logger instance with a given scope name
 *
 * The scope is added to the prefix for easy identification of log sources.
 *
 * @param {string} scope - Scope identifier (e.g., 'MediaService', 'BulkDownload')
 * @param {Partial<LoggerConfig>} [config] - Configuration override
 * @returns {Logger} - Logger instance with scope
 *
 * @example
 * const slog = createScopedLogger('MediaExtractor');
 * slog.info('Processing media...');
 * // Output: [XEG] [MediaExtractor] [INFO] Processing media...
 *
 * @public
 */
export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createScopedLoggerImpl(scope, config);
}

/**
 * Creates a scoped logger with correlation ID for request tracing
 *
 * Combines scope and correlation ID for comprehensive log tracing across
 * asynchronous operations and multiple services.
 *
 * @param {string} scope - Scope identifier
 * @param {string} correlationId - Unique correlation ID (e.g., from createCorrelationId())
 * @param {Partial<LoggerConfig>} [config] - Configuration override
 * @returns {Logger} - Logger instance with scope and correlation ID
 *
 * @example
 * const cid = createCorrelationId();
 * const slog = createScopedLoggerWithCorrelation('BulkDownload', cid);
 * slog.info('Download started');
 * // Output: [XEG] [BulkDownload] [cid:abc123def] [INFO] Download started
 *
 * @public
 */
export function createScopedLoggerWithCorrelation(
  scope: string,
  correlationId: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return createScopedLoggerWithCorrelationImpl(scope, correlationId, config);
}

/**
 * Generates a unique correlation ID for request tracing
 *
 * Uses cryptographic random values if available, falls back to Math.random().
 * Correlation IDs help track related log entries across multiple operations.
 *
 * @returns {string} - Unique correlation ID (base36 encoded)
 *
 * @example
 * const correlationId = createCorrelationId();
 * // Result: "3a7f8e2b" or similar
 *
 * @public
 */
export function createCorrelationId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const num = Array.from(bytes).reduce((acc, b) => (acc << 8) | b, 0) >>> 0;
      return num.toString(36);
    }
  } catch {
    // Fallback to Math.random if crypto fails
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Measures performance of a synchronous or asynchronous function
 *
 * Logs execution time in milliseconds. Timing is only collected in development mode;
 * in production, the function executes without timing overhead.
 *
 * @template T - Return type of the function
 * @param {string} label - Human-readable label for the timer
 * @param {() => T | Promise<T>} fn - Synchronous or asynchronous function to measure
 * @returns {Promise<T>} - Result of the function
 *
 * @example
 * const result = await measurePerformance('extract-media', async () => {
 *   return await extractMediaData();
 * });
 *
 * @public
 */
export async function measurePerformance<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
  if (isDev) {
    logger.time(label);
    try {
      return await fn();
    } finally {
      logger.timeEnd(label);
    }
  }

  return await fn();
}

/**
 * Logs an error with structured context information
 *
 * Formats error messages consistently with optional context and source information.
 * Includes stack trace logging in development mode.
 *
 * @param {Error | string} error - Error object or error message string
 * @param {Record<string, string | number | boolean>} [context] - Additional context data
 * @param {string} [source] - Source identifier (e.g., component or service name)
 *
 * @example
 * try {
 *   await downloadMedia();
 * } catch (error) {
 *   logError(error, { mediaId: '12345', retryCount: 2 }, 'BulkDownloader');
 * }
 *
 * @public
 */
export function logError(
  error: Error | string,
  context: Record<string, string | number | boolean> = {},
  source?: string
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorContext = {
    source,
    context,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Error${source ? ` in ${source}` : ''}: ${errorMessage}`, errorContext);

  if (isDev && error instanceof Error && error.stack) {
    logger.debug('Error stack:', error.stack);
  }
}

export default logger;
