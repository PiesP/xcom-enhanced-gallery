/**
 * @fileoverview Unified application error reporter
 * @description Centralizes error handling patterns across the application.
 *
 * Phase: Refactoring - Error handling consolidation
 *
 * This module provides:
 * - Consistent error reporting interface
 * - Context-aware error logging
 * - Severity-based error handling
 * - Optional UI notification integration
 */

import { logger } from '@shared/logging';

// ============================================================================
// Types
// ============================================================================

/**
 * Error severity levels
 * - critical: Application cannot continue, should throw
 * - error: Operation failed, should log as error but may recover
 * - warning: Non-critical issue, should log as warning
 * - info: Informational only, for debugging
 */
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Error context categories for grouping and filtering
 */
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

/**
 * Error report options
 */
export interface ErrorReportOptions {
  /** Error context category */
  readonly context: ErrorContext;
  /** Error severity level */
  readonly severity?: ErrorSeverity;
  /** Additional metadata for debugging */
  readonly metadata?: Record<string, unknown>;
  /** Whether to show UI notification (default: false for non-critical) */
  readonly notify?: boolean;
  /** Custom error code for categorization */
  readonly code?: string;
}

/**
 * Error report result
 */
export interface ErrorReportResult {
  /** Whether the error was reported successfully */
  readonly reported: boolean;
  /** Normalized error message */
  readonly message: string;
  /** Error context */
  readonly context: ErrorContext;
  /** Error severity */
  readonly severity: ErrorSeverity;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_LOG_MAP: Record<ErrorSeverity, 'error' | 'warn' | 'info' | 'debug'> = {
  critical: 'error',
  error: 'error',
  warning: 'warn',
  info: 'info',
} as const;

const DEFAULT_SEVERITY: ErrorSeverity = 'error';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize any error value to a string message
 */
export function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name || 'Error';
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  if (error && typeof error === 'object') {
    if ('message' in error && typeof (error as { message: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  if (error === null) {
    return 'null';
  }

  if (error === undefined) {
    return 'undefined';
  }

  return String(error);
}

/**
 * Extract stack trace from error if available
 */
function extractStackTrace(error: unknown): string | undefined {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return undefined;
}

/**
 * Format context tag for log messages
 */
function formatContextTag(context: ErrorContext, code?: string): string {
  const base = `[${context.charAt(0).toUpperCase() + context.slice(1)}]`;
  return code ? `${base}[${code}]` : base;
}

// ============================================================================
// AppErrorReporter Class
// ============================================================================

/**
 * Centralized error reporter for the application.
 *
 * Usage:
 * ```typescript
 * import { AppErrorReporter } from '@shared/error/app-error-reporter';
 *
 * // Report an error
 * AppErrorReporter.report(error, {
 *   context: 'gallery',
 *   severity: 'error',
 *   metadata: { tweetId: '123' }
 * });
 *
 * // Report with notification
 * AppErrorReporter.report(error, {
 *   context: 'download',
 *   severity: 'error',
 *   notify: true
 * });
 *
 * // Critical error (will throw)
 * AppErrorReporter.report(error, {
 *   context: 'bootstrap',
 *   severity: 'critical'
 * });
 * ```
 */
export class AppErrorReporter {
  private static notificationCallback: ((message: string, context: ErrorContext) => void) | null =
    null;

  /**
   * Set callback for UI notifications
   * This allows decoupling from NotificationService
   */
  public static setNotificationCallback(
    callback: ((message: string, context: ErrorContext) => void) | null,
  ): void {
    AppErrorReporter.notificationCallback = callback;
  }

  /**
   * Report an error with context and severity
   *
   * @param error - The error to report (can be any type)
   * @param options - Report options including context and severity
   * @returns Report result with normalized message
   * @throws Re-throws error if severity is 'critical'
   */
  public static report(error: unknown, options: ErrorReportOptions): ErrorReportResult {
    const severity = options.severity ?? DEFAULT_SEVERITY;
    const message = normalizeErrorMessage(error);
    const tag = formatContextTag(options.context, options.code);
    const logLevel = SEVERITY_LOG_MAP[severity];
    const stack = extractStackTrace(error);

    // Build log payload
    const logPayload: Record<string, unknown> = {
      context: options.context,
      severity,
    };

    if (options.metadata) {
      logPayload.metadata = options.metadata;
    }

    if (stack && severity !== 'info') {
      logPayload.stack = stack;
    }

    // Log the error
    logger[logLevel](`${tag} ${message}`, logPayload);

    // Show notification if requested
    if (options.notify && AppErrorReporter.notificationCallback) {
      AppErrorReporter.notificationCallback(message, options.context);
    }

    const result: ErrorReportResult = {
      reported: true,
      message,
      context: options.context,
      severity,
    };

    // Critical errors should throw
    if (severity === 'critical') {
      throw error instanceof Error ? error : new Error(message);
    }

    return result;
  }

  /**
   * Report an error and return a default value
   * Useful for catch blocks that need to return something
   */
  public static reportAndReturn<T>(
    error: unknown,
    options: ErrorReportOptions,
    defaultValue: T,
  ): T {
    // Don't throw for critical in this variant - caller handles recovery
    const effectiveOptions = {
      ...options,
      severity: options.severity === 'critical' ? 'error' : options.severity,
    } as ErrorReportOptions;

    AppErrorReporter.report(error, effectiveOptions);
    return defaultValue;
  }

  /**
   * Create a context-bound reporter for convenience
   *
   * @param context - Default context for all reports
   * @returns Bound reporter functions
   *
   * @example
   * ```typescript
   * const reporter = AppErrorReporter.forContext('gallery');
   * reporter.error(err, { code: 'OPEN_FAILED' });
   * reporter.warn(err, { notify: true });
   * ```
   */
  public static forContext(context: ErrorContext): ContextBoundReporter {
    return {
      critical: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) =>
        AppErrorReporter.report(error, { ...options, context, severity: 'critical' }),

      error: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) =>
        AppErrorReporter.report(error, { ...options, context, severity: 'error' }),

      warn: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) =>
        AppErrorReporter.report(error, { ...options, context, severity: 'warning' }),

      info: (error: unknown, options?: Partial<Omit<ErrorReportOptions, 'context'>>) =>
        AppErrorReporter.report(error, { ...options, context, severity: 'info' }),
    };
  }
}

/**
 * Context-bound reporter interface
 */
export interface ContextBoundReporter {
  critical: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>,
  ) => ErrorReportResult;
  error: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>,
  ) => ErrorReportResult;
  warn: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>,
  ) => ErrorReportResult;
  info: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>,
  ) => ErrorReportResult;
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Pre-bound reporters for common contexts
 */
export const bootstrapErrorReporter = AppErrorReporter.forContext('bootstrap');
export const galleryErrorReporter = AppErrorReporter.forContext('gallery');
export const mediaErrorReporter = AppErrorReporter.forContext('media');
export const downloadErrorReporter = AppErrorReporter.forContext('download');
export const settingsErrorReporter = AppErrorReporter.forContext('settings');
export const eventErrorReporter = AppErrorReporter.forContext('event');
export const networkErrorReporter = AppErrorReporter.forContext('network');
export const storageErrorReporter = AppErrorReporter.forContext('storage');
export const uiErrorReporter = AppErrorReporter.forContext('ui');
