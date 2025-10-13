/**
 * Logger utility for X.com Enhanced Gallery
 *
 * Provides consistent logging interface with different log levels and formatting.
 * All logs are prefixed with [XEG] for easy identification in browser console.
 *
 * @fileoverview Centralized logging utility
 * @version 1.1.0
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
    try {
      if (typeof window !== 'undefined') {
        const gmInfo = (window as unknown as Record<string, unknown>)['GM_info'];
        const unsafeWin = (window as unknown as Record<string, unknown>).unsafeWindow;
        if (gmInfo !== undefined || unsafeWin !== undefined) {
          return 'info';
        }
      }
    } catch {
      // ignore access errors
    }

    try {
      const env = import.meta?.env;
      if (env?.DEV || env?.MODE === 'development' || env?.MODE === 'test') {
        return 'debug';
      }
    } catch {
      // ignore
    }

    try {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
        return 'info';
      }
    } catch {
      // ignore
    }

    return 'info';
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

  const shouldLog = (level: LogLevel, config: LoggerConfig): boolean =>
    LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];

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

const devLikeMode =
  import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test' || import.meta.env.DEV;

export const logger: Logger = createLogger({
  level: devLikeMode ? 'debug' : 'warn',
  includeTimestamp: devLikeMode,
  includeStackTrace: devLikeMode,
});

export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createScopedLoggerImpl(scope, config);
}

export function createScopedLoggerWithCorrelation(
  scope: string,
  correlationId: string,
  config: Partial<LoggerConfig> = {}
): Logger {
  return createScopedLoggerWithCorrelationImpl(scope, correlationId, config);
}

export function createCorrelationId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      const bytes = new Uint8Array(8);
      crypto.getRandomValues(bytes);
      const num = Array.from(bytes).reduce((acc, b) => (acc << 8) | b, 0) >>> 0;
      return num.toString(36);
    }
  } catch {
    // ignore
  }
  return Math.random().toString(36).slice(2, 10);
}

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
