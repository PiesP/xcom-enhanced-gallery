/**
 * @fileoverview Higher-Order Functions for Error Handling
 * @description Provides functional error handling patterns as an alternative to context-bound reporters.
 */

import {
  type AsyncResult,
  ErrorCode,
  failure,
  type Result,
  success,
} from '@shared/types/result.types';
import {
  AppErrorReporter,
  type ErrorContext,
  type ErrorReportOptions,
  type ErrorSeverity,
} from './app-error-reporter';
import { isAbortError, isTimeoutError } from './cancellation';

type ErrorMetadataFn = (error: unknown) => Record<string, unknown>;

// ============================================================================
// Types
// ============================================================================

/**
 * Options for error handling HOF
 */
export interface ErrorHandlingOptions<T = void> {
  /** Error context for reporting */
  readonly context: ErrorContext;
  /** Error severity level (default: 'error') */
  readonly severity?: ErrorSeverity;
  /** Whether to show UI notification on error */
  readonly notify?: boolean;
  /** Optional error code for categorization */
  readonly code?: string;
  /** Optional fallback value returned on error */
  readonly fallback?: T;
  /** Rethrow errors after reporting (default: false) */
  readonly rethrow?: boolean;
  /** Additional metadata (static or computed from error) */
  readonly metadata?: Record<string, unknown> | ErrorMetadataFn;
  /** Custom error transformer before reporting */
  readonly transformError?: (error: unknown) => unknown;
}

/**
 * Result wrapper for error-handled operations
 */
export interface ErrorHandlingResult<T> {
  /** Whether the operation succeeded */
  readonly success: boolean;
  /** The result value (undefined on error unless fallback provided) */
  readonly value: T | undefined;
  /** The error if operation failed */
  readonly error?: unknown;
}

/**
 * Options for Result-based error handling
 */
export interface ResultHandlingOptions {
  /** Error context for reporting */
  readonly context: ErrorContext;
  /** Error severity level (default: 'error') */
  readonly severity?: ErrorSeverity;
  /** Optional error code override for categorization */
  readonly code?: string;
  /** Whether to show UI notification on error */
  readonly notify?: boolean;
  /** Additional metadata generator (receives the error) */
  readonly metadata?: (error: unknown) => Record<string, unknown>;
  /** Custom error transformer before reporting */
  readonly transformError?: (error: unknown) => unknown;
  /** Custom error code mapper (default: mapErrorToCode) */
  readonly errorCodeMapper?: (error: unknown) => string;
}

/**
 * Context-bound error handler factory output.
 * Kept as an explicit interface to allow lazy wrappers to preserve types.
 */
export interface ErrorHandlers {
  wrap: <TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
  ) => (...args: TArgs) => Promise<TReturn | undefined>;

  wrapSync: <TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
  ) => (...args: TArgs) => TReturn | undefined;

  wrapResult: <TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    options?: Omit<ErrorHandlingOptions<TReturn>, 'context' | 'fallback' | 'rethrow'>
  ) => (...args: TArgs) => Promise<ErrorHandlingResult<TReturn>>;

  wrapSyncResult: <TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    options?: Omit<ErrorHandlingOptions<TReturn>, 'context' | 'fallback' | 'rethrow'>
  ) => (...args: TArgs) => ErrorHandlingResult<TReturn>;

  wrapWithResult: <TArgs extends unknown[], TData>(
    fn: (...args: TArgs) => Promise<TData>,
    options?: Omit<ResultHandlingOptions, 'context'>
  ) => (...args: TArgs) => AsyncResult<TData>;

  wrapSyncWithResult: <TArgs extends unknown[], TData>(
    fn: (...args: TArgs) => TData,
    options?: Omit<ResultHandlingOptions, 'context'>
  ) => (...args: TArgs) => Result<TData>;

  tryAsync: <T>(
    fn: () => Promise<T>,
    options: Omit<ErrorHandlingOptions<T>, 'context'>
  ) => Promise<T | undefined>;

  trySync: <T>(fn: () => T, options: Omit<ErrorHandlingOptions<T>, 'context'>) => T | undefined;
}

// ============================================================================
// Internal helpers
// ============================================================================

function resolveError(rawError: unknown, transformError?: (error: unknown) => unknown): unknown {
  if (!transformError) {
    return rawError;
  }

  try {
    return transformError(rawError);
  } catch {
    return rawError;
  }
}

function resolveMetadata(
  error: unknown,
  metadata?: Record<string, unknown> | ErrorMetadataFn
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined;
  }

  if (typeof metadata === 'function') {
    return metadata(error);
  }

  return metadata;
}

function resolveReportOptions(
  reportOptions: Omit<
    ErrorHandlingOptions<unknown>,
    'fallback' | 'rethrow' | 'metadata' | 'transformError'
  >,
  error: unknown,
  metadata?: Record<string, unknown> | ErrorMetadataFn
): ErrorReportOptions {
  const resolvedMetadata = resolveMetadata(error, metadata);

  return {
    ...reportOptions,
    ...(resolvedMetadata && { metadata: resolvedMetadata }),
  };
}

function reportAndReturnOrThrow<TReturn>(
  error: unknown,
  reportOptions: ErrorReportOptions,
  fallback: TReturn | undefined,
  rethrow: boolean
): TReturn | undefined {
  if (rethrow) {
    AppErrorReporter.report(error, reportOptions);
    throw error;
  }

  return AppErrorReporter.reportAndReturn(error, reportOptions, fallback as TReturn);
}

// ============================================================================
// Higher-Order Functions
// ============================================================================

/**
 * Wraps an async function with automatic error handling and reporting.
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: ErrorHandlingOptions<TReturn>
): (...args: TArgs) => Promise<TReturn | undefined> {
  const { fallback, rethrow = false, transformError, metadata, ...reportOptions } = options;

  return async (...args: TArgs): Promise<TReturn | undefined> => {
    try {
      return await fn(...args);
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadata);
      return reportAndReturnOrThrow(error, fullOptions, fallback, rethrow);
    }
  };
}

/**
 * Wraps a sync function with automatic error handling and reporting.
 */
export function withSyncErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: ErrorHandlingOptions<TReturn>
): (...args: TArgs) => TReturn | undefined {
  const { fallback, rethrow = false, transformError, metadata, ...reportOptions } = options;

  return (...args: TArgs): TReturn | undefined => {
    try {
      return fn(...args);
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadata);
      return reportAndReturnOrThrow(error, fullOptions, fallback, rethrow);
    }
  };
}

/**
 * Wraps an async function and returns a result object instead of throwing.
 */
export function withErrorResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: Omit<ErrorHandlingOptions<TReturn>, 'fallback' | 'rethrow'>
): (...args: TArgs) => Promise<ErrorHandlingResult<TReturn>> {
  const { transformError, metadata, ...reportOptions } = options;

  return async (...args: TArgs): Promise<ErrorHandlingResult<TReturn>> => {
    try {
      const value = await fn(...args);
      return { success: true, value };
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadata);
      AppErrorReporter.report(error, fullOptions);
      return { success: false, value: undefined, error };
    }
  };
}

/**
 * Wraps a sync function and returns a result object instead of throwing.
 */
export function withSyncErrorResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: Omit<ErrorHandlingOptions<TReturn>, 'fallback' | 'rethrow'>
): (...args: TArgs) => ErrorHandlingResult<TReturn> {
  const { transformError, metadata, ...reportOptions } = options;

  return (...args: TArgs): ErrorHandlingResult<TReturn> => {
    try {
      const value = fn(...args);
      return { success: true, value };
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadata);
      AppErrorReporter.report(error, fullOptions);
      return { success: false, value: undefined, error };
    }
  };
}

/**
 * Execute a one-off async operation with error handling.
 */
export function tryAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions<T>
): Promise<T | undefined> {
  return withErrorHandling(fn, options)();
}

/**
 * Execute a one-off sync operation with error handling.
 */
export function trySync<T>(fn: () => T, options: ErrorHandlingOptions<T>): T | undefined {
  return withSyncErrorHandling(fn, options)();
}

// ============================================================================
// Result-based HOFs (Integration with Result<T> type)
// ============================================================================

function mapErrorToCode(error: unknown): string {
  if (isTimeoutError(error)) {
    return ErrorCode.TIMEOUT;
  }

  if (isAbortError(error)) {
    return ErrorCode.CANCELLED;
  }

  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return ErrorCode.NETWORK;
    }
  }

  return ErrorCode.UNKNOWN;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error instanceof DOMException) {
    return error.message;
  }

  return String(error);
}

function createResultFailure(
  rawError: unknown,
  options: ResultHandlingOptions
): {
  readonly reportError: unknown;
  readonly reportOptions: ErrorReportOptions;
  readonly result: Result<never>;
} {
  const {
    code: overrideCode,
    errorCodeMapper = mapErrorToCode,
    transformError,
    metadata: metadataFn,
    ...reportOptions
  } = options;

  const error = resolveError(rawError, transformError);
  const errorMessage = normalizeError(error);
  const errorCode = overrideCode ?? errorCodeMapper(error);
  const dynamicMetadata = metadataFn ? metadataFn(error) : undefined;

  const fullOptions: ErrorReportOptions = {
    ...reportOptions,
    code: String(errorCode),
    ...(dynamicMetadata && { metadata: dynamicMetadata }),
  };

  const result = failure(
    errorMessage,
    errorCode as unknown as (typeof ErrorCode)[keyof typeof ErrorCode],
    {
      cause: error,
      ...(dynamicMetadata && { meta: dynamicMetadata }),
    }
  );

  return {
    reportError: error,
    reportOptions: fullOptions,
    result: result as unknown as Result<never>,
  };
}

/**
 * Wraps an async function to return Result<T> instead of throwing.
 */
export function withResultHandling<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<TData>,
  options: ResultHandlingOptions
): (...args: TArgs) => AsyncResult<TData> {
  return async (...args: TArgs): AsyncResult<TData> => {
    try {
      const data = await fn(...args);
      return success(data);
    } catch (rawError) {
      const { reportError, reportOptions, result } = createResultFailure(rawError, options);
      AppErrorReporter.report(reportError, reportOptions);
      return result as unknown as AsyncResult<TData>;
    }
  };
}

/**
 * Wraps a sync function to return Result<T> instead of throwing.
 */
export function withSyncResultHandling<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => TData,
  options: ResultHandlingOptions
): (...args: TArgs) => Result<TData> {
  return (...args: TArgs): Result<TData> => {
    try {
      const data = fn(...args);
      return success(data);
    } catch (rawError) {
      const { reportError, reportOptions, result } = createResultFailure(rawError, options);
      AppErrorReporter.report(reportError, reportOptions);
      return result as unknown as Result<TData>;
    }
  };
}

// ============================================================================
// Factory for Context-Scoped HOFs
// ============================================================================

/**
 * Creates a set of error handling HOFs pre-bound to a specific context.
 */
export function createErrorHandlers(context: ErrorContext): ErrorHandlers {
  return {
    wrap: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => Promise<TReturn>,
      options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
    ) => withErrorHandling(fn, { ...options, context }),

    wrapSync: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => TReturn,
      options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
    ) => withSyncErrorHandling(fn, { ...options, context }),

    wrapResult: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => Promise<TReturn>,
      options?: Omit<ErrorHandlingOptions<TReturn>, 'context' | 'fallback' | 'rethrow'>
    ) => withErrorResult(fn, { ...options, context }),

    wrapSyncResult: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => TReturn,
      options?: Omit<ErrorHandlingOptions<TReturn>, 'context' | 'fallback' | 'rethrow'>
    ) => withSyncErrorResult(fn, { ...options, context }),

    wrapWithResult: <TArgs extends unknown[], TData>(
      fn: (...args: TArgs) => Promise<TData>,
      options?: Omit<ResultHandlingOptions, 'context'>
    ) => withResultHandling(fn, { ...options, context }),

    wrapSyncWithResult: <TArgs extends unknown[], TData>(
      fn: (...args: TArgs) => TData,
      options?: Omit<ResultHandlingOptions, 'context'>
    ) => withSyncResultHandling(fn, { ...options, context }),

    tryAsync: <T>(fn: () => Promise<T>, options: Omit<ErrorHandlingOptions<T>, 'context'>) =>
      tryAsync(fn, { ...options, context }),

    trySync: <T>(fn: () => T, options: Omit<ErrorHandlingOptions<T>, 'context'>) =>
      trySync(fn, { ...options, context }),
  };
}

// ============================================================================
// Pre-bound handlers
// ============================================================================

export const bootstrapErrors = createErrorHandlers('bootstrap');
export const galleryErrors = createErrorHandlers('gallery');
export const mediaErrors = createErrorHandlers('media');
export const networkErrors = createErrorHandlers('network');
