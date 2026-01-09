/**
 * @fileoverview Type definitions for promise helper utilities
 * @description Callback signatures, options, and deferred promise interface
 */

/**
 * Generic result callback signature for callback-based APIs.
 * When called successfully, `result` is defined and `error` is falsy.
 * When called with an error, `error` is truthy and `result` may be undefined.
 */
export type ResultCallback<TResult, TError = string | null | undefined> = (
  result?: TResult,
  error?: TError
) => void;

/**
 * Void callback signature for callback-based APIs that only report errors.
 * Called with no error on success, or with a truthy error on failure.
 */
export type VoidCallback<TError = string | null | undefined> = (error?: TError) => void;

/**
 * Options for promisifying callback-based APIs.
 */
export interface PromisifyOptions<TFallback> {
  /**
   * Called when the primary method fails.
   * May be sync or async (returned value will be resolved).
   */
  readonly fallback?: () => TFallback | Promise<TFallback>;
  /**
   * Context identifier for error logging and debugging.
   */
  readonly context?: string;
}

/**
 * A minimal Deferred implementation.
 * Represents a Promise with exposed resolve/reject handlers.
 * @template T - The type of value the promise resolves to
 */
export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}
