/**
 * @fileoverview Bootstrap error helpers.
 * @description Modernized error strategy utilities with minimal surface area.
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import type { Logger } from '@shared/logging';

type BootstrapErrorSeverity = 'critical' | 'recoverable';

type BootstrapErrorLogger = Pick<Logger, 'error' | 'warn'>;

type BootstrapErrorOptions = Readonly<{
  context: string;
  logger: BootstrapErrorLogger;
  severity?: BootstrapErrorSeverity;
}>;

function normalizeBootstrapErrorMessage(error: unknown): string {
  const message = normalizeErrorMessage(error);
  return message.length > 0 ? message : 'Unknown bootstrap error';
}

/**
 * Log bootstrap errors using a severity-aware strategy and optionally rethrow.
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

;
