/**
 * Logger utility for X.com Enhanced Gallery
 *
 * Provides consistent logging interface with different log levels and formatting.
 * All logs are prefixed with [XEG] for easy identification in browser console.
 *
 * @fileoverview Centralized logging utility
 * @version 1.0.0
 */

/**
 * Log levels for filtering and controlling output.
 */
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

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
 * Logger configuration options.
 */
interface LoggerConfig {
  /** Minimum log level to output */
  readonly level: LogLevel;
  /** Application prefix for log messages */
  readonly prefix: string;
  /** Whether to include timestamps */
  readonly includeTimestamp: boolean;
  /** Whether to include stack traces for errors */
  readonly includeStackTrace: boolean;
  /** Optional correlation id for structured tracing */
  readonly correlationId?: string;
}

/**
 * Determine environment-based log level
 * Production builds should use 'info' to reduce console noise
 * Development builds can use 'debug' for detailed logging
 */
function getEnvironmentLogLevel(): LogLevel {
  // Check if we're in a userscript environment (production)
  try {
    if (typeof window !== 'undefined') {
      const gmInfo = (window as unknown as Record<string, unknown>).GM_info;
      const unsafeWin = (window as unknown as Record<string, unknown>).unsafeWindow;
      if (gmInfo !== undefined || unsafeWin !== undefined) {
        return 'info';
      }
    }
  } catch {
    // Ignore access errors
  }

  // Check for Vite development mode
  try {
    if (import.meta?.env?.DEV) {
      return 'debug';
    }
  } catch {
    // Ignore if import.meta is not available
  }

  // Check for production build indicators
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      return 'info';
    }
  } catch {
    // Ignore if process is not available
  }

  // Default to info for safety
  return 'info';
}

/**
 * Default logger configuration.
 */
const DEFAULT_CONFIG = {
  level: getEnvironmentLogLevel(),
  prefix: '[XEG]',
  includeTimestamp: true,
  includeStackTrace: true,
} as const satisfies LoggerConfig;

/**
 * Log level priority mapping for filtering.
 */
const LOG_LEVEL_PRIORITY = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const satisfies Record<LogLevel, number>;

/**
 * Detect whether we're running under Vitest or explicit test mode.
 */
function isTestEnv(): boolean {
  try {
    if (typeof process !== 'undefined' && process.env?.VITEST) return true;
  } catch {
    // ignore
  }
  try {
    // Vite exposes MODE === 'test' when configured
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') return true;
  } catch {
    // ignore
  }
  return false;
}

/**
 * Creates a formatted log message with prefix and optional timestamp.
 */
function formatMessage(
  level: LogLevel,
  config: LoggerConfig,
  ...args: LoggableData[]
): LoggableData[] {
  const prefix = config.prefix;
  const levelTag = `[${level.toUpperCase()}]`;

  // In test environment, keep output stable for assertions: no timestamp/correlation id
  if (isTestEnv()) {
    return [`${prefix} ${levelTag}`, ...args];
  }

  const timestamp = config.includeTimestamp ? `[${new Date().toISOString()}]` : '';
  const cid = config.correlationId ? `[cid:${String(config.correlationId)}]` : '';
  const prefixParts = [prefix, timestamp, levelTag, cid].filter(Boolean);
  return [prefixParts.join(' '), ...args];
}

/**
 * Checks if a log level should be output based on current configuration.
 */
function shouldLog(level: LogLevel, config: LoggerConfig): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
}

/**
 * Safely invoke a console method with fallbacks. Some tests may stub console methods
 * to non-function values, so we defensively check and fall back to other methods.
 */
function safeConsoleLog(level: LogLevel, formattedArgs: LoggableData[]): void {
  // Determine preferred console methods per level
  const candidates: Array<keyof Console> =
    level === 'error'
      ? ['error', 'warn', 'log']
      : level === 'warn'
        ? ['warn', 'log']
        : ['info', 'log']; // for info/debug we prefer info, then log

  for (const method of candidates) {
    try {
      const fn = (console as unknown as Record<string, unknown>)[method];
      if (typeof fn === 'function') {
        (fn as (...args: unknown[]) => void)(...formattedArgs);
        return;
      }
    } catch {
      // ignore and try next candidate
    }
  }
  // If no viable console method is available, silently no-op.
}

/**
 * Timer storage interface for fallback timer implementation.
 */
interface TimerStorage {
  [key: string]: number;
}

/**
 * Global timer storage for browsers without console.time support.
 */
const timerStorage: TimerStorage = {};

/**
 * Creates a logger instance with the specified configuration.
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const finalConfig: LoggerConfig = { ...DEFAULT_CONFIG, ...config };

  return {
    info: (...args: LoggableData[]): void => {
      if (shouldLog('info', finalConfig)) {
        safeConsoleLog('info', formatMessage('info', finalConfig, ...args));
      }
    },

    warn: (...args: LoggableData[]): void => {
      if (shouldLog('warn', finalConfig)) {
        safeConsoleLog('warn', formatMessage('warn', finalConfig, ...args));
      }
    },

    error: (...args: LoggableData[]): void => {
      if (shouldLog('error', finalConfig)) {
        safeConsoleLog('error', formatMessage('error', finalConfig, ...args));

        // Add stack trace for errors if enabled
        if (finalConfig.includeStackTrace && args.length > 0) {
          const firstArg = args[0];
          if (firstArg instanceof Error && firstArg.stack) {
            safeConsoleLog(
              'error',
              formatMessage('error', finalConfig, 'Stack trace:', firstArg.stack)
            );
          }
        }
      }
    },

    debug: (...args: LoggableData[]): void => {
      if (shouldLog('debug', finalConfig)) {
        // Use info/log for debug level to satisfy environments without console.debug
        safeConsoleLog('debug', formatMessage('debug', finalConfig, ...args));
      }
    },

    time: (label: string): void => {
      if (shouldLog('debug', finalConfig)) {
        const timerKey = `__timer_${label}`;
        timerStorage[timerKey] = Date.now();
        safeConsoleLog('debug', formatMessage('debug', finalConfig, `Timer started: ${label}`));
      }
    },

    timeEnd: (label: string): void => {
      if (shouldLog('debug', finalConfig)) {
        const timerKey = `__timer_${label}`;
        const startTime = timerStorage[timerKey];

        if (typeof startTime === 'number') {
          const duration = Date.now() - startTime;
          const durationMessage = `${label}: ${duration}ms`;
          safeConsoleLog('debug', formatMessage('debug', finalConfig, durationMessage));
          delete timerStorage[timerKey];
        } else {
          const errorMessage = `Timer '${label}' was not started`;
          safeConsoleLog('debug', formatMessage('debug', finalConfig, errorMessage));
        }
      }
    },
  };
}

/**
 * Default logger instance for the application.
 */
export const logger: Logger = createLogger({
  // 테스트 환경(Vitest)과 개발 모드에서는 debug 레벨로 상세 로깅을 허용한다.
  // 프로덕션(Userscript 번들 포함)에서는 경고 이상만 표시한다.
  level:
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') ||
    (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') ||
    (typeof process !== 'undefined' && !!process.env?.VITEST)
      ? 'debug'
      : 'warn',
  includeTimestamp:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.MODE === 'development' || import.meta.env?.MODE === 'test')) ||
    (typeof process !== 'undefined' && !!process.env?.VITEST),
  includeStackTrace:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.MODE === 'development' || import.meta.env?.MODE === 'test')) ||
    (typeof process !== 'undefined' && !!process.env?.VITEST),
});

/**
 * Creates a scoped logger with a specific prefix.
 *
 * @param scope - Scope identifier to append to the main prefix
 * @param config - Additional logger configuration
 * @returns A new logger instance with the scoped prefix
 *
 * @example
 * ```typescript
 * const galleryLogger = createScopedLogger('Gallery');
 * galleryLogger.info('Gallery opened'); // Output: [XEG] [Gallery] Gallery opened
 * ```
 */
export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createLogger({
    ...config,
    prefix: `${DEFAULT_CONFIG.prefix} [${scope}]`,
  });
}

/**
 * Generates a short correlation id for tracing a request/task chain.
 * Uses crypto.getRandomValues when available, falls back to Math.random.
 */
export function createCorrelationId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      // Convert to base36 for compact readability
      const num = Array.from(bytes).reduce((acc, b) => (acc << 8) | b, 0) >>> 0;
      return num.toString(36);
    }
  } catch {
    // ignore
  }
  // Fallback
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Creates a scoped logger that embeds a correlation id into every log line.
 *
 * Example output: [XEG] [BulkDownload] [DEBUG] [cid:abcd1234] message
 */
export function createScopedLoggerWithCorrelation(
  scope: string,
  correlationId: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return createLogger({
    ...config,
    prefix: `${DEFAULT_CONFIG.prefix} [${scope}]`,
    correlationId,
  });
}

/**
 * Performance logging utility for measuring execution time.
 *
 * @param label - Label for the performance measurement
 * @param fn - Function to measure
 * @returns The result of the function execution
 *
 * @example
 * ```typescript
 * const result = await measurePerformance('API Call', async () => {
 *   return await fetchData();
 * });
 * ```
 */
export async function measurePerformance<T>(label: string, fn: () => T | Promise<T>): Promise<T> {
  logger.time(label);
  try {
    const result = await fn();
    return result;
  } finally {
    logger.timeEnd(label);
  }
}

/**
 * Error logging utility with structured error information.
 *
 * @param error - Error object or message
 * @param context - Additional context information
 * @param source - Source component or module where error occurred
 *
 * @example
 * ```typescript
 * try {
 *   await downloadFile(url);
 * } catch (error) {
 *   logError(error, { url, attempt: 1 }, 'DownloadService');
 * }
 * ```
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

  if (error instanceof Error && error.stack) {
    logger.debug('Error stack:', error.stack);
  }
}

/**
 * Standardized logging field helper
 *
 * Use this to build structured log objects with consistent keys across the app.
 * Recommended keys:
 * - filename: string
 * - size: number (bytes)
 * - durationMs: number
 * - total: number
 * - count/successful/failed: number
 */
export function logFields<T extends Record<string, unknown>>(fields: T): T {
  return fields;
}

export default logger;
