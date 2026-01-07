/**
 * Production logging (bundle-size optimized).
 *
 * Note:
 * - This module is intended to be used via Vite aliasing in production builds.
 * - Keep the exported API shape aligned with `@shared/logging`.
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
const noop = (): void => {};
const hasConsole = typeof console !== 'undefined';

function buildErrorOnlyLogger(prefix: string): Logger {
  if (!hasConsole) {
    return { info: noop, warn: noop, error: noop, debug: noop, trace: noop };
  }

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

function formatPrefix(prefix: string, scope?: string): string {
  if (!scope) {
    return prefix;
  }
  return `${prefix} [${scope}]`;
}

export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const prefix = config.prefix ?? BASE_PREFIX;
  return buildErrorOnlyLogger(prefix);
}

export function createScopedLogger(scope: string, config: Partial<LoggerConfig> = {}): Logger {
  const prefix = formatPrefix(config.prefix ?? BASE_PREFIX, scope);
  return buildErrorOnlyLogger(prefix);
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
