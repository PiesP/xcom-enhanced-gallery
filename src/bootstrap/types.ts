/**
 * @fileoverview Bootstrap error helpers.
 * @description Modernized error strategy utilities with minimal surface area.
 */

import type { Logger } from '@shared/logging';

export type BootstrapErrorSeverity = 'critical' | 'recoverable';

type BootstrapErrorLogger = Pick<Logger, 'error' | 'warn'>;

type BootstrapErrorBehavior = Readonly<{
  logLevel: 'error' | 'warn';
  throwOnError: boolean;
}>;

const ERROR_BEHAVIOR_MAP: Record<BootstrapErrorSeverity, BootstrapErrorBehavior> = {
  critical: { logLevel: 'error', throwOnError: true },
  recoverable: { logLevel: 'warn', throwOnError: false },
} as const;

export type BootstrapErrorOptions = Readonly<{
  context: string;
  logger: BootstrapErrorLogger;
  severity?: BootstrapErrorSeverity;
}>;

const normalizeErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return 'Unknown bootstrap error';
};

/**
 * Log bootstrap errors using a severity-aware strategy and optionally rethrow.
 */
export function reportBootstrapError(error: unknown, options: BootstrapErrorOptions): never | void {
  const severity = options.severity ?? 'recoverable';
  const behavior = ERROR_BEHAVIOR_MAP[severity];
  const message = `[${options.context}] initialization failed: ${normalizeErrorMessage(error)}`;

  options.logger[behavior.logLevel](message, error);

  if (behavior.throwOnError) {
    throw error instanceof Error ? error : new Error(message);
  }
}

export type { BootstrapErrorLogger };
