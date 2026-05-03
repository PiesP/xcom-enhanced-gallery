/**
 * @fileoverview Error reporting: types, singleton reporter, and context-bound helpers.
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';

// ============================================================================
// Types
// ============================================================================

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
  readonly notify?: boolean;
  readonly code?: string;
}

export interface ErrorReportResult {
  readonly reported: boolean;
  readonly message: string;
  readonly context: ErrorContext;
  readonly severity: ErrorSeverity;
}

export interface ContextBoundReporter {
  critical: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => ErrorReportResult;
  error: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => ErrorReportResult;
  warn: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => ErrorReportResult;
  info: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) => ErrorReportResult;
}

// ============================================================================
// Reporter
// ============================================================================

const DEFAULT_SEVERITY: ErrorSeverity = 'error';
let notificationCallback: ((message: string, context: ErrorContext) => void) | null = null;

export function setNotificationCallback(cb: typeof notificationCallback): void {
  notificationCallback = cb;
}

export function reportError(error: unknown, options: ErrorReportOptions): ErrorReportResult {
  const severity = options.severity ?? DEFAULT_SEVERITY;
  const message = normalizeErrorMessage(error);

  const payload: Record<string, unknown> = { c: options.context, s: severity };
  if (options.code) payload.cd = options.code;
  if (options.metadata) payload.m = options.metadata;

  if (__DEV__) {
    if (severity === 'info') logger.info(message, payload);
    else if (severity === 'warning') logger.warn(message, payload);
    else logger.error(message, payload);
  }

  if (options.notify && notificationCallback) {
    notificationCallback(message, options.context);
  }

  if (severity === 'critical') {
    throw error instanceof Error ? error : new Error(message);
  }

  return { reported: true, message, context: options.context, severity };
}

function forContext(context: ErrorContext): ContextBoundReporter {
  const bind = (severity: ErrorSeverity) =>
    (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) =>
      reportError(error, { ...options, context, severity });
  return { critical: bind('critical'), error: bind('error'), warn: bind('warning'), info: bind('info') };
}

export const bootstrapErrorReporter = forContext('bootstrap');
export const galleryErrorReporter = forContext('gallery');
export const mediaErrorReporter = forContext('media');
export const settingsErrorReporter = forContext('settings');

export { normalizeErrorMessage };
