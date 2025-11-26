/**
 * @fileoverview Centralized Logging Infrastructure
 * @version 2.1.0 - Simplified for production
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LoggableData = unknown;

export interface Logger {
  info: (...args: LoggableData[]) => void;
  warn: (...args: LoggableData[]) => void;
  error: (...args: LoggableData[]) => void;
  debug: (...args: LoggableData[]) => void;
  trace?: (...args: LoggableData[]) => void;
}

interface LoggerConfig {
  readonly level: LogLevel;
  readonly prefix: string;
}

const BASE_PREFIX = '[XEG]';
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Optimized for tree-shaking: Use __DEV__ directly when available
const isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const createNoOpLogger = (): Logger => {
  const noop = (): void => {};
  return { info: noop, warn: noop, error: noop, debug: noop, trace: noop };
};

let createLoggerImpl: (config?: Partial<LoggerConfig>) => Logger;
let createScopedLoggerImpl: (scope: string, config?: Partial<LoggerConfig>) => Logger;

if (isDev) {
  const DEFAULT_CONFIG: LoggerConfig = {
    level: 'debug',
    prefix: BASE_PREFIX,
  };

  const shouldLog = (level: LogLevel, config: LoggerConfig): boolean => {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.level];
  };

  const formatMessage = (config: LoggerConfig, ...args: LoggableData[]): LoggableData[] => {
    return [config.prefix, ...args];
  };

  createLoggerImpl = (config: Partial<LoggerConfig> = {}): Logger => {
    const finalConfig: LoggerConfig = { ...DEFAULT_CONFIG, ...config };

    return {
      info: (...args: LoggableData[]): void => {
        if (shouldLog('info', finalConfig)) {
          console.info(...formatMessage(finalConfig, ...args));
        }
      },
      warn: (...args: LoggableData[]): void => {
        if (shouldLog('warn', finalConfig)) {
          console.warn(...formatMessage(finalConfig, ...args));
        }
      },
      error: (...args: LoggableData[]): void => {
        if (shouldLog('error', finalConfig)) {
          console.error(...formatMessage(finalConfig, ...args));
        }
      },
      debug: (...args: LoggableData[]): void => {
        if (shouldLog('debug', finalConfig)) {
          console.info(...formatMessage(finalConfig, ...args));
        }
      },
      trace: (...args: LoggableData[]): void => {
        if (shouldLog('debug', finalConfig)) {
          console.debug(...formatMessage(finalConfig, ...args));
        }
      },
    };
  };

  createScopedLoggerImpl = (scope: string, config: Partial<LoggerConfig> = {}): Logger =>
    createLoggerImpl({
      ...config,
      prefix: `${config.prefix ?? BASE_PREFIX} [${scope}]`,
    });
} else {
  createLoggerImpl = () => createNoOpLogger();
  createScopedLoggerImpl = () => createNoOpLogger();
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  return createLoggerImpl(config);
}

export const logger: Logger = createLogger({
  level: isDev ? 'debug' : 'warn',
});

export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createScopedLoggerImpl(scope, config);
}

export function logError(
  error: Error | string,
  context: Record<string, unknown> = {},
  source?: string,
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  logger.error(`Error${source ? ` in ${source}` : ''}: ${errorMessage}`, context);
}
