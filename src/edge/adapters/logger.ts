import type { LogLevel } from '@core/cmd';
import { logger } from '@shared/logging';

export function log(
  level: LogLevel,
  message: string,
  context?: Readonly<Record<string, unknown>>
): void {
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
