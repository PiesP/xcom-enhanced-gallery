import type {
  Deferred,
  PromisifyOptions,
  ResultCallback,
} from '@shared/utils/async/promise-helpers.types';

export function promisifyCallback<TResult>(
  executor: (callback: ResultCallback<TResult>) => void,
  options?: PromisifyOptions<TResult>
): Promise<TResult> {
  return new Promise((resolve, reject) => {
    try {
      executor((result, error) => {
        if (error) {
          if (options?.fallback) {
            resolve(Promise.resolve(options.fallback()));
          } else {
            reject(new Error(String(error)));
          }
          return;
        }
        resolve(result as TResult);
      });
    } catch (error) {
      if (options?.fallback) {
        resolve(Promise.resolve(options.fallback()));
      } else {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    }
  });
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
