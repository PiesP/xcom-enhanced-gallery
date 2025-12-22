/**
 * @fileoverview Higher-Order Functions for Error Handling
 * @description Provides functional error handling patterns as an alternative to context-bound reporters.
 *
 * This module implements:
 * - `withErrorHandling()` HOF for wrapping async functions
 * - `withSyncErrorHandling()` HOF for wrapping sync functions
 * - Automatic error reporting with customizable behavior
 *
 * @example
 * ```typescript
 * // Wrap an async function with error handling
 * const safeFetch = withErrorHandling(
 *   fetchData,
 *   { context: 'network', fallback: [] }
 * );
 *
 * // Wrap a sync function
 * const safeParser = withSyncErrorHandling(
 *   parseJson,
 *   { context: 'media', fallback: null }
 * );
 * ```
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
import { isTimeoutError } from './cancellation';

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
  /** Optional error code for categorization */
  readonly code?: string;
  /** Whether to show UI notification on error */
  readonly notify?: boolean;
  /** Fallback value to return on error */
  readonly fallback?: T;
  /** Additional metadata generator (receives the error) */
  readonly metadata?: (error: unknown) => Record<string, unknown>;
  /** Whether to rethrow the error after reporting (default: false) */
  readonly rethrow?: boolean;
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

function resolveError(rawError: unknown, transformError?: (error: unknown) => unknown): unknown {
  return transformError ? transformError(rawError) : rawError;
}

function resolveReportOptions(
  reportOptions: Omit<
    ErrorHandlingOptions<unknown>,
    'fallback' | 'rethrow' | 'metadata' | 'transformError'
  >,
  error: unknown,
  metadataFn?: ErrorMetadataFn
): ErrorReportOptions {
  const dynamicMetadata = metadataFn ? metadataFn(error) : null;
  return dynamicMetadata ? { ...reportOptions, metadata: dynamicMetadata } : reportOptions;
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

/**
 * Options for Result-based error handling
 */
export interface ResultHandlingOptions {
  /** Error context for reporting */
  readonly context: ErrorContext;
  /** Error severity level (default: 'error') */
  readonly severity?: ErrorSeverity;
  /** Optional error code override for categorization */
  readonly code?: ErrorCode;
  /** Whether to show UI notification on error */
  readonly notify?: boolean;
  /** Additional metadata generator (receives the error) */
  readonly metadata?: (error: unknown) => Record<string, unknown>;
  /** Custom error transformer before reporting */
  readonly transformError?: (error: unknown) => unknown;
  /** Custom error code mapper (default: mapErrorToCode) */
  readonly errorCodeMapper?: (error: unknown) => ErrorCode;
}

// ============================================================================
// Higher-Order Functions
// ============================================================================

/**
 * Wraps an async function with automatic error handling and reporting.
 *
 * @param fn - The async function to wrap
 * @param options - Error handling configuration
 * @returns Wrapped function that catches and reports errors
 *
 * @example
 * ```typescript
 * const safeLoad = withErrorHandling(
 *   async (id: string) => await fetchUser(id),
 *   { context: 'network', fallback: null }
 * );
 *
 * const user = await safeLoad('123'); // Returns null on error
 * ```
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: ErrorHandlingOptions<TReturn>
): (...args: TArgs) => Promise<TReturn | undefined> {
  const {
    fallback,
    rethrow = false,
    transformError,
    metadata: metadataFn,
    ...reportOptions
  } = options;

  return async (...args: TArgs): Promise<TReturn | undefined> => {
    try {
      return await fn(...args);
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadataFn);
      return reportAndReturnOrThrow(error, fullOptions, fallback, rethrow);
    }
  };
}

/**
 * Wraps a sync function with automatic error handling and reporting.
 *
 * @param fn - The sync function to wrap
 * @param options - Error handling configuration
 * @returns Wrapped function that catches and reports errors
 *
 * @example
 * ```typescript
 * const safeParse = withSyncErrorHandling(
 *   (json: string) => JSON.parse(json),
 *   { context: 'media', fallback: {} }
 * );
 *
 * const data = safeParse(jsonString); // Returns {} on error
 * ```
 */
export function withSyncErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: ErrorHandlingOptions<TReturn>
): (...args: TArgs) => TReturn | undefined {
  const {
    fallback,
    rethrow = false,
    transformError,
    metadata: metadataFn,
    ...reportOptions
  } = options;

  return (...args: TArgs): TReturn | undefined => {
    try {
      return fn(...args);
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadataFn);
      return reportAndReturnOrThrow(error, fullOptions, fallback, rethrow);
    }
  };
}

/**
 * Wraps an async function and returns a result object instead of throwing.
 *
 * @param fn - The async function to wrap
 * @param options - Error handling configuration (without fallback)
 * @returns Wrapped function that returns {success, value, error}
 *
 * @example
 * ```typescript
 * const tryFetch = withErrorResult(
 *   async (url: string) => await fetch(url).then(r => r.json()),
 *   { context: 'network' }
 * );
 *
 * const result = await tryFetch('/api/data');
 * if (result.success) {
 *   console.log(result.value);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export function withErrorResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: Omit<ErrorHandlingOptions<TReturn>, 'fallback' | 'rethrow'>
): (...args: TArgs) => Promise<ErrorHandlingResult<TReturn>> {
  const { transformError, metadata: metadataFn, ...reportOptions } = options;

  return async (...args: TArgs): Promise<ErrorHandlingResult<TReturn>> => {
    try {
      const value = await fn(...args);
      return { success: true, value };
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadataFn);
      AppErrorReporter.report(error, fullOptions);
      return { success: false, value: undefined, error };
    }
  };
}

/**
 * Wraps a sync function and returns a result object instead of throwing.
 *
 * @param fn - The sync function to wrap
 * @param options - Error handling configuration (without fallback)
 * @returns Wrapped function that returns {success, value, error}
 */
export function withSyncErrorResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: Omit<ErrorHandlingOptions<TReturn>, 'fallback' | 'rethrow'>
): (...args: TArgs) => ErrorHandlingResult<TReturn> {
  const { transformError, metadata: metadataFn, ...reportOptions } = options;

  return (...args: TArgs): ErrorHandlingResult<TReturn> => {
    try {
      const value = fn(...args);
      return { success: true, value };
    } catch (rawError) {
      const error = resolveError(rawError, transformError);
      const fullOptions = resolveReportOptions(reportOptions, error, metadataFn);
      AppErrorReporter.report(error, fullOptions);
      return { success: false, value: undefined, error };
    }
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Execute an async operation with error handling, without permanently wrapping.
 * Useful for one-off operations.
 *
 * @param fn - The async operation to execute
 * @param options - Error handling configuration
 * @returns The result or fallback value
 *
 * @example
 * ```typescript
 * const data = await tryAsync(
 *   () => fetchData(id),
 *   { context: 'network', fallback: null }
 * );
 * ```
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions<T>
): Promise<T | undefined> {
  return withErrorHandling(fn, options)();
}

/**
 * Execute a sync operation with error handling, without permanently wrapping.
 *
 * @param fn - The sync operation to execute
 * @param options - Error handling configuration
 * @returns The result or fallback value
 *
 * @example
 * ```typescript
 * const data = trySync(
 *   () => JSON.parse(jsonString),
 *   { context: 'media', fallback: {} }
 * );
 * ```
 */
export function trySync<T>(fn: () => T, options: ErrorHandlingOptions<T>): T | undefined {
  return withSyncErrorHandling(fn, options)();
}

// ============================================================================
// Result-based HOFs (Integration with Result<T> type)
// ============================================================================

/**
 * Maps errors to appropriate ErrorCode values
 *
 * @param error - The error to map
 * @returns Appropriate ErrorCode
 *
 * @internal
 */
function mapErrorToCode(error: unknown): ErrorCode {
  // AbortError → CANCELLED
  if ((error instanceof DOMException || error instanceof Error) && error.name === 'AbortError') {
    return ErrorCode.CANCELLED;
  }

  // Network errors
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes('fetch') || message.includes('network')) {
      return ErrorCode.NETWORK;
    }
  }

  // Timeout errors
  if (isTimeoutError(error)) {
    return ErrorCode.TIMEOUT;
  }

  // Default to UNKNOWN
  return ErrorCode.UNKNOWN;
}

/**
 * Normalizes error to string message
 *
 * @param error - The error to normalize
 * @returns Error message string
 *
 * @internal
 */
function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
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

  const result = failure(errorMessage, errorCode, {
    cause: error,
    ...(dynamicMetadata && { meta: dynamicMetadata }),
  });

  return {
    reportError: error,
    reportOptions: fullOptions,
    result: result as unknown as Result<never>,
  };
}

/**
 * Wraps an async function to return Result<T> instead of throwing.
 * Integrates with AppErrorReporter for centralized error logging.
 *
 * @param fn - The async function to wrap
 * @param options - Result handling configuration
 * @returns Wrapped function that returns AsyncResult<T>
 *
 * @example
 * ```typescript
 * const fetchUser = withResultHandling(
 *   async (id: string) => await api.getUser(id),
 *   { context: 'network' }
 * );
 *
 * const result = await fetchUser('123');
 * if (result.status === 'success') {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error, result.code);
 * }
 * ```
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
 * Integrates with AppErrorReporter for centralized error logging.
 *
 * @param fn - The sync function to wrap
 * @param options - Result handling configuration
 * @returns Wrapped function that returns Result<T>
 *
 * @example
 * ```typescript
 * const parseJson = withSyncResultHandling(
 *   (json: string) => JSON.parse(json),
 *   { context: 'media' }
 * );
 *
 * const result = parseJson(jsonString);
 * if (result.status === 'success') {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error, result.code);
 * }
 * ```
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
 * This provides a functional alternative to ContextBoundReporter.
 *
 * @param context - The error context to bind
 * @returns Object with pre-bound HOFs
 *
 * @example
 * ```typescript
 * const galleryErrors = createErrorHandlers('gallery');
 *
 * const safeOpen = galleryErrors.wrap(
 *   async (items) => await openGallery(items),
 *   { fallback: false }
 * );
 * ```
 */
export function createErrorHandlers(context: ErrorContext): ErrorHandlers {
  return {
    /**
     * Wrap an async function with error handling
     */
    wrap: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => Promise<TReturn>,
      options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
    ) => withErrorHandling(fn, { ...options, context }),

    /**
     * Wrap a sync function with error handling
     */
    wrapSync: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => TReturn,
      options: Omit<ErrorHandlingOptions<TReturn>, 'context'>
    ) => withSyncErrorHandling(fn, { ...options, context }),

    /**
     * Wrap an async function returning a result object
     */
    wrapResult: <TArgs extends unknown[], TReturn>(
      fn: (...args: TArgs) => Promise<TReturn>,
      options?: Omit<ErrorHandlingOptions<TReturn>, 'context' | 'fallback' | 'rethrow'>
    ) => withErrorResult(fn, { ...options, context }),

    /**
     * Wrap an async function returning Result<T>
     */
    wrapWithResult: <TArgs extends unknown[], TData>(
      fn: (...args: TArgs) => Promise<TData>,
      options?: Omit<ResultHandlingOptions, 'context'>
    ) => withResultHandling(fn, { ...options, context }),

    /**
     * Wrap a sync function returning Result<T>
     */
    wrapSyncWithResult: <TArgs extends unknown[], TData>(
      fn: (...args: TArgs) => TData,
      options?: Omit<ResultHandlingOptions, 'context'>
    ) => withSyncResultHandling(fn, { ...options, context }),

    /**
     * Execute a one-off async operation
     */
    tryAsync: <T>(fn: () => Promise<T>, options: Omit<ErrorHandlingOptions<T>, 'context'>) =>
      tryAsync(fn, { ...options, context }),

    /**
     * Execute a one-off sync operation
     */
    trySync: <T>(fn: () => T, options: Omit<ErrorHandlingOptions<T>, 'context'>) =>
      trySync(fn, { ...options, context }),
  };
}

function createLazyErrorHandlers(context: ErrorContext): ErrorHandlers {
  let cached: ErrorHandlers | null = null;
  const get = (): ErrorHandlers => {
    if (!cached) {
      cached = createErrorHandlers(context);
    }
    return cached;
  };

  return {
    wrap: ((fn, options) => get().wrap(fn, options)) as ErrorHandlers['wrap'],
    wrapSync: ((fn, options) => get().wrapSync(fn, options)) as ErrorHandlers['wrapSync'],
    wrapResult: ((fn, options) => get().wrapResult(fn, options)) as ErrorHandlers['wrapResult'],
    wrapWithResult: ((fn, options) =>
      get().wrapWithResult(fn, options)) as ErrorHandlers['wrapWithResult'],
    wrapSyncWithResult: ((fn, options) =>
      get().wrapSyncWithResult(fn, options)) as ErrorHandlers['wrapSyncWithResult'],
    tryAsync: ((fn, options) => get().tryAsync(fn, options)) as ErrorHandlers['tryAsync'],
    trySync: ((fn, options) => get().trySync(fn, options)) as ErrorHandlers['trySync'],
  };
}

// ============================================================================
// Pre-bound Context Handlers (Alternative to pre-bound reporters)
// ============================================================================

/**
 * Pre-bound error handlers for common contexts.
 * These provide a functional alternative to bootstrapErrorReporter, etc.
 */
export const bootstrapErrors = createLazyErrorHandlers('bootstrap');
export const galleryErrors = createLazyErrorHandlers('gallery');
export const mediaErrors = createLazyErrorHandlers('media');
export const downloadErrors = createLazyErrorHandlers('download');
export const settingsErrors = createLazyErrorHandlers('settings');
export const eventErrors = createLazyErrorHandlers('event');
export const networkErrors = createLazyErrorHandlers('network');
export const storageErrors = createLazyErrorHandlers('storage');
export const uiErrors = createLazyErrorHandlers('ui');
