import type {
  ContextBoundReporter,
  ErrorContext,
  ErrorReportOptions,
  ErrorReportResult,
  ErrorSeverity,
} from '@shared/error/app-error-reporter.types';
import { normalizeErrorMessage } from '@shared/error/normalize';
import { logger } from '@shared/logging/logger';

export type {
  ContextBoundReporter,
  ErrorContext,
  ErrorReportOptions,
  ErrorReportResult,
  ErrorSeverity,
} from '@shared/error/app-error-reporter.types';
export { normalizeErrorMessage };

const DEFAULT_SEVERITY: ErrorSeverity = 'error';

export class AppErrorReporter {
  private static notificationCallback: ((message: string, context: ErrorContext) => void) | null =
    null;

  public static setNotificationCallback(
    callback: ((message: string, context: ErrorContext) => void) | null
  ): void {
    AppErrorReporter.notificationCallback = callback;
  }

  public static report(error: unknown, options: ErrorReportOptions): ErrorReportResult {
    const severity = options.severity ?? DEFAULT_SEVERITY;
    const message = normalizeErrorMessage(error);

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

    if (options.notify && AppErrorReporter.notificationCallback) {
      AppErrorReporter.notificationCallback(message, options.context);
    }

    const result: ErrorReportResult = {
      reported: true,
      message,
      context: options.context,
      severity,
    };

    if (severity === 'critical') {
      throw error instanceof Error ? error : new Error(message);
    }

    return result;
  }

  public static reportAndReturn<T>(
    error: unknown,
    options: ErrorReportOptions,
    defaultValue: T
  ): T {
    const effectiveOptions = {
      ...options,
      severity: options.severity === 'critical' ? 'error' : options.severity,
    } as ErrorReportOptions;

    AppErrorReporter.report(error, effectiveOptions);
    return defaultValue;
  }

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

export const bootstrapErrorReporter = AppErrorReporter.forContext('bootstrap');
export const galleryErrorReporter = AppErrorReporter.forContext('gallery');
export const mediaErrorReporter = AppErrorReporter.forContext('media');
export const settingsErrorReporter = AppErrorReporter.forContext('settings');
