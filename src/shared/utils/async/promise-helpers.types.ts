export type ResultCallback<TResult, TError = string | null | undefined> = (
  result?: TResult,
  error?: TError
) => void;

export interface PromisifyOptions<TFallback> {
  readonly fallback?: () => TFallback | Promise<TFallback>;
  readonly context?: string;
}

export interface Deferred<T> {
  readonly promise: Promise<T>;
  readonly resolve: (value: T | PromiseLike<T>) => void;
  readonly reject: (reason?: unknown) => void;
}
