/**
 * @fileoverview Bootstrap error reporting utilities.
 *
 * Centralized error handling with severity-aware logging. Critical errors halt bootstrap;
 * recoverable errors log but continue with degraded functionality.
 *
 * Production optimization: `logger.warn()` calls are stripped, so recoverable errors
 * are promoted to `error` level in production to remain visible.
 *
 * @module bootstrap/types
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import type { Logger } from '@shared/logging/logger';

/** Severity level: 'critical' (rethrows), 'recoverable' (logs, continues) */
type BootstrapErrorSeverity = 'critical' | 'recoverable';

/** Logger subset for bootstrap (only error and warn methods) */
type BootstrapErrorLogger = Pick<Logger, 'error' | 'warn'>;

/**
 * Bootstrap error reporting options.
 * @property context - Error source label (e.g., 'ThemeService')
 * @property logger - Logger instance
 * @property severity - Error severity; defaults to 'recoverable'
 */
type BootstrapErrorOptions = Readonly<{
  context: string;
  logger: BootstrapErrorLogger;
  severity?: BootstrapErrorSeverity;
}>;

/** @internal Normalize error to non-empty message */
function normalizeBootstrapErrorMessage(error: unknown): string {
  const message = normalizeErrorMessage(error);
  return message.length > 0 ? message : 'Unknown bootstrap error';
}

/**
 * Report bootstrap errors with severity-aware logging and conditional throwing.
 *
 * Routes errors based on severity:
 * - **critical**: Logs at error level, rethrows to halt bootstrap
 * - **recoverable** (default): Logs (warn in dev, error in prod), continues execution
 *
 * Message format: `[context] initialization failed: <message>`
 *
 * @param error - Error to report (any type from try-catch or Promise rejection)
 * @param options - Configuration with context, logger, and severity
 * @throws When severity is 'critical', rethrows the original error
 *
 * @example
 * ```typescript
 * try {
 *   await criticalService.initialize();
 * } catch (error) {
 *   reportBootstrapError(error, {
 *     context: 'CriticalService',
 *     logger,
 *     severity: 'critical',
 *   });
 * }
 * ```
 */
export function reportBootstrapError(error: unknown, options: BootstrapErrorOptions): never | void {
  const severity = options.severity ?? 'recoverable';
  const isCritical = severity === 'critical';
  const message = `[${options.context}] initialization failed: ${normalizeBootstrapErrorMessage(error)}`;

  // Bundle-size note: production builds strip logger.warn calls.
  // Keep recoverable bootstrap signals visible by promoting them to error in prod.
  if (isCritical) {
    options.logger.error(message, error);
  } else if (__DEV__) {
    options.logger.warn(message, error);
  } else {
    options.logger.error(message, error);
  }

  if (isCritical) {
    throw error instanceof Error ? error : new Error(message);
  }
}
