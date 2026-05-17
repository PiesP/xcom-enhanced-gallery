/**
 * @fileoverview Error reporting: types, singleton reporter, and context-bound helpers.
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

export type ErrorContext =
  | 'bootstrap'
  | 'gallery'
  | 'media'
  | 'download'
  | 'settings'
  | 'theme'
  | 'event'
  | 'network'
  | 'storage'
  | 'ui'
  | 'unknown';

export interface ErrorReportOptions {
  readonly context: ErrorContext;
  readonly severity?: ErrorSeverity;
  readonly metadata?: Record<string, unknown>;
  readonly code?: string;
}

export interface ContextBoundReporter {
  critical: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => void;
  error: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => void;
  warn: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => void;
  info: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => void;
}

export function reportError(error: unknown, options: ErrorReportOptions): void {
  const severity = options.severity ?? 'error';
  const message = normalizeErrorMessage(error);

  const payload: Record<string, unknown> = { context: options.context, severity };
  if (options.code) payload.code = options.code;
  if (options.metadata) payload.metadata = options.metadata;

  if (__DEV__) {
    if (severity === 'info') logger.info(message, payload);
    else if (severity === 'warning') logger.warn(message, payload);
    else logger.error(message, payload);
  }

  if (severity === 'critical') {
    console.error('[Critical Error]', message, payload);
  }
}

function forContext(context: ErrorContext): ContextBoundReporter {
  const bind =
    (severity: ErrorSeverity) => (error: unknown, options?: Omit<ErrorReportOptions, 'context'>) =>
      reportError(error, { ...options, context, severity });
  return {
    critical: bind('critical'),
    error: bind('error'),
    warn: bind('warning'),
    info: bind('info'),
  };
}

export const bootstrapErrorReporter = forContext('bootstrap');
export const galleryErrorReporter = forContext('gallery');
export const mediaErrorReporter = forContext('media');
export const settingsErrorReporter = forContext('settings');

export { normalizeErrorMessage };
