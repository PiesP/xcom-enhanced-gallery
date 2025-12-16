/**
 * @fileoverview Centralized Logging Infrastructure
 * @version 3.0.0 - Enhanced log level management with runtime configuration
 *
 * Features:
 * - Tree-shakeable: Production builds eliminate all debug code
 * - Runtime configurable: Log level can be changed at runtime in dev
 * - Environment variable support: VITE_LOG_LEVEL in development
 * - Structured logging: Consistent format with context support
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import { DEFAULT_LOG_LEVEL, getLogLevel, LOG_LEVEL_PRIORITY } from './log-level';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LoggableData = unknown;

export interface Logger {
  info: (...args: LoggableData[]) => void;
  warn: (...args: LoggableData[]) => void;
  error: (...args: LoggableData[]) => void;
  debug: (...args: LoggableData[]) => void;
  trace?: (...args: LoggableData[]) => void;
}

export interface LoggerConfig {
  readonly level: LogLevel;
  readonly prefix: string;
}

const BASE_PREFIX = '[XEG]';

// Optimized for tree-shaking: Prefer __DEV__ when available.
// Safe fallback: default to non-dev unless Vite's import.meta.env.DEV says otherwise.
const isDev: boolean = typeof __DEV__ !== 'undefined' ? __DEV__ : Boolean(import.meta.env?.DEV);

const createNoOpLogger = (): Logger => {
  const noop = (): void => {};
  return { info: noop, warn: noop, error: noop, debug: noop, trace: noop };
};

let createLoggerImpl: (config?: Partial<LoggerConfig>) => Logger;
let createScopedLoggerImpl: (scope: string, config?: Partial<LoggerConfig>) => Logger;

if (isDev) {
  const DEFAULT_CONFIG: LoggerConfig = {
    level: DEFAULT_LOG_LEVEL,
    prefix: BASE_PREFIX,
  };

  /**
   * Check if a log level should be displayed based on current runtime level
   * Uses the centralized log level configuration
   */
  const shouldLog = (level: LogLevel, _config: LoggerConfig): boolean => {
    // Use runtime log level for dynamic configuration support
    const currentLevel = getLogLevel();
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
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
  level: DEFAULT_LOG_LEVEL,
});

export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  return createScopedLoggerImpl(scope, config);
}

export function logError(
  error: Error | string,
  context: Record<string, unknown> = {},
  source?: string
): void {
  const errorMessage = normalizeErrorMessage(error);
  logger.error(`Error${source ? ` in ${source}` : ''}: ${errorMessage}`, context);
}
