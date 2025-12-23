/**
 * @fileoverview Unified application error reporter (optimized for bundle size)
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

import { normalizeErrorMessage } from '@shared/error/normalize';
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
type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Error context categories for grouping and filtering
 */
type ErrorContext =
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
interface ErrorReportOptions {
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
interface ErrorReportResult {
  /** Whether the error was reported successfully */
  readonly reported: boolean;
  /** Normalized error message */
  readonly message: string;
  /** Error context */
  readonly context: ErrorContext;
  /** Error severity */
  readonly severity: ErrorSeverity;
}

/**
 * Context-bound reporter interface
 */
interface ContextBoundReporter {
  critical: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  error: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  warn: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
  info: (
    error: unknown,
    options?: Partial<Omit<ErrorReportOptions, 'context'>>
  ) => ErrorReportResult;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SEVERITY: ErrorSeverity = 'error';

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
class AppErrorReporter {
  private static notificationCallback: ((message: string, context: ErrorContext) => void) | null =
    null;

  /**
   * Set callback for UI notifications
   * This allows decoupling from NotificationService
   */
  public static setNotificationCallback(
    callback: ((message: string, context: ErrorContext) => void) | null
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

    // Production bundle-size note:
    // - Keep payload keys short because minification is disabled.
    // - Avoid tag-building / string formatting helpers.
    const payload: Record<string, unknown> = {
      c: options.context,
      s: severity,
    };

    if (options.code) {
      payload.cd = options.code;
    }

    if (options.metadata) {
      payload.m = options.metadata;
    }

    if (__DEV__) {
      if (severity === 'info') {
        logger.info(message, payload);
      } else if (severity === 'warning') {
        logger.warn(message, payload);
      } else {
        logger.error(message, payload);
      }
    }

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
    defaultValue: T
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

// Preserve the existing named export for downstream imports.
;

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Pre-bound reporters for common contexts
 */
export const bootstrapErrorReporter = AppErrorReporter.forContext('bootstrap');
export const galleryErrorReporter = AppErrorReporter.forContext('gallery');
export const mediaErrorReporter = AppErrorReporter.forContext('media');
export const settingsErrorReporter = AppErrorReporter.forContext('settings');
