/**
 * @fileoverview Unified application error reporter (optimized for bundle size)
 * @description Centralizes error handling patterns across the application.
 */

import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';

type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';

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

interface ErrorReportOptions {
  readonly context: ErrorContext;
  readonly severity?: ErrorSeverity;
  readonly metadata?: Record<string, unknown>;
  readonly notify?: boolean;
  readonly code?: string;
}

interface ErrorReportResult {
  readonly reported: boolean;
  readonly message: string;
  readonly context: ErrorContext;
  readonly severity: ErrorSeverity;
}

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

const DEFAULT_SEVERITY: ErrorSeverity = 'error';

/**
 * Centralized error reporter for the application.
 * Provides context-aware error reporting with severity levels and optional notifications.
 */
class AppErrorReporter {
  private static notificationCallback: ((message: string, context: ErrorContext) => void) | null =
    null;

  /**
   * Set callback for UI notifications (decouples from NotificationService)
   * @param callback Notification callback or null to disable
   */
  public static setNotificationCallback(
    callback: ((message: string, context: ErrorContext) => void) | null
  ): void {
    AppErrorReporter.notificationCallback = callback;
  }

  /**
   * Report an error with context and severity
   * @param error The error to report (can be any type)
   * @param options Report options including context and severity
   * @returns Report result with normalized message
   * @throws Re-throws error if severity is 'critical'
   */
  public static report(error: unknown, options: ErrorReportOptions): ErrorReportResult {
    const severity = options.severity ?? DEFAULT_SEVERITY;
    const message = normalizeErrorMessage(error);

    // Production bundle-size optimization:
    // - Keep payload keys short because minification is disabled
    // - Avoid tag-building / string formatting helpers
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

    // Log based on severity (development only)
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
   * Report an error and return a default value (never throws)
   * Critical errors are downgraded to 'error' severity.
   * @param error The error to report
   * @param options Report options including context and severity
   * @param defaultValue Value to return after reporting
   * @returns The provided default value
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
   * Create a context-bound reporter with predefined context
   * @param context Default context for all reports
   * @returns Bound reporter functions (critical, error, warn, info)
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

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Pre-bound reporters for common contexts (reduce boilerplate in feature code)
 */
export const bootstrapErrorReporter = AppErrorReporter.forContext('bootstrap');
export const galleryErrorReporter = AppErrorReporter.forContext('gallery');
export const mediaErrorReporter = AppErrorReporter.forContext('media');
export const settingsErrorReporter = AppErrorReporter.forContext('settings');

/**
 * Main error reporter class
 */
export { AppErrorReporter };
