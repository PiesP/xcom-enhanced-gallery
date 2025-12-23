/**
 * @fileoverview Centralized Logging Infrastructure (minimal)
 *
 * Production: emit errors only.
 * Development: emit all log levels.
 */

import { normalizeErrorMessage } from '@shared/error/normalize';

type LoggableData = unknown;

export interface Logger {
  info: (...args: LoggableData[]) => void;
  warn: (...args: LoggableData[]) => void;
  error: (...args: LoggableData[]) => void;
  debug: (...args: LoggableData[]) => void;
  trace?: (...args: LoggableData[]) => void;
}

interface LoggerConfig {
  readonly prefix: string;
}

const BASE_PREFIX = '[XEG]';
const hasConsole = typeof console !== 'undefined';
const noop = (): void => {};

function buildLogger(prefix: string, enableVerbose: boolean): Logger {
  if (!hasConsole) {
    return { info: noop, warn: noop, error: noop, debug: noop, trace: noop };
  }

  if (!enableVerbose) {
    return {
      info: noop,
      warn: noop,
      debug: noop,
      trace: noop,
      error: (...args: LoggableData[]): void => {
        console.error(prefix, ...args);
      },
    };
  }

  return {
    info: (...args: LoggableData[]): void => {
      console.info(prefix, ...args);
    },
    warn: (...args: LoggableData[]): void => {
      console.warn(prefix, ...args);
    },
    error: (...args: LoggableData[]): void => {
      console.error(prefix, ...args);
    },
    debug: (...args: LoggableData[]): void => {
      console.info(prefix, ...args);
    },
    trace: (...args: LoggableData[]): void => {
      console.debug(prefix, ...args);
    },
  };
}

function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const prefix = config.prefix ?? BASE_PREFIX;
  return buildLogger(prefix, __DEV__);
}

export const logger: Logger = createLogger();

function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  const prefix = `${config.prefix ?? BASE_PREFIX} [${scope}]`;
  return createLogger({ ...config, prefix });
}

function logError(
  error: Error | string,
  context: Record<string, unknown> = {},
  source?: string
): void {
  const errorMessage = normalizeErrorMessage(error);
  logger.error(`Error${source ? ` in ${source}` : ''}: ${errorMessage}`, context);
}
