/**
 * @fileoverview Centralized Logging Infrastructure (minimal)
 *
 * Production: emit errors only.
 * Development: emit all log levels.
 */

export type LoggableData = unknown;

export interface Logger {
  info: (...args: LoggableData[]) => void;
  warn: (...args: LoggableData[]) => void;
  error: (...args: LoggableData[]) => void;
  debug: (...args: LoggableData[]) => void;
  trace?: (...args: LoggableData[]) => void;
}

export interface LoggerConfig {
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
      console.debug(prefix, ...args);
    },
    trace: (...args: LoggableData[]): void => {
      console.debug(prefix, ...args);
    },
  };
}

function formatPrefix(prefix: string, scope?: string): string {
  if (!scope) {
    return prefix;
  }
  return `${prefix} [${scope}]`;
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const prefix = config.prefix ?? BASE_PREFIX;
  return buildLogger(prefix, __DEV__);
}

export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  const basePrefix = config.prefix ?? BASE_PREFIX;
  return buildLogger(formatPrefix(basePrefix, scope), __DEV__);
}

export const logger: Logger = createLogger();

export function logError(
  error: unknown,
  context: Readonly<Record<string, unknown>> = {},
  source?: string
): void {
  const message = error instanceof Error ? error.message : String(error);
  if (source) {
    createScopedLogger(source).error(message, context);
    return;
  }
  logger.error(message, context);
}
