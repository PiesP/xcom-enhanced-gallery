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

const noop = (): void => {};

const NOOP_LOGGER: Logger = {
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  trace: noop,
};

export function createLogger(_config: Partial<LoggerConfig> = {}): Logger {
  return NOOP_LOGGER;
}

export const logger: Logger = NOOP_LOGGER;

export function createScopedLogger(_scope: string, _config: Partial<LoggerConfig> = {}): Logger {
  return NOOP_LOGGER;
}

export function logError(
  _error: Error | string,
  _context: Record<string, unknown> = {},
  _source?: string
): void {
  // Intentionally noop in production builds.
}
