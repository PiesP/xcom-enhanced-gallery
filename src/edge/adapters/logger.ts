import type { LogLevel } from '@core/cmd';
import { logger } from '@shared/logging';

export function log(
  level: LogLevel,
  message: string,
  context?: Readonly<Record<string, unknown>>
): void {
  // Production bundles keep only error logging; other levels are dev-only.
  // This matches the default logger behavior (info/warn/debug/trace are no-ops)
  // while allowing Rollup to tree-shake message strings and branches.
  if (!__DEV__) {
    if (level === 'error') {
      logger.error(message, context);
    }
    return;
  }

  switch (level) {
    case 'debug':
      logger.debug(message, context);
      return;
    case 'info':
      logger.info(message, context);
      return;
    case 'warn':
      logger.warn(message, context);
      return;
    case 'error':
      logger.error(message, context);
      return;
    default:
      logger.info(message, context);
  }
}
