/**
 * @fileoverview Small async lazy-loader utilities.
 *
 * Note: This module does not use dynamic imports directly. Callers may pass an async
 * factory (e.g. a mocked import function in tests).
 */

export interface LazyLoader<T> {
  load(): Promise<T>;
  preload(): void;
  reset(): void;
  isLoaded(): boolean;
}

export interface LazyLoaderOptions {
  /** Number of retries after the initial attempt. */
  retries?: number;
  /** Delay between retries in milliseconds. */
  retryDelay?: number;
  /** Optional callback invoked when a load attempt fails. */
  onError?: (error: unknown) => void;
  /** Enable extra runtime checks/logging (kept minimal). */
  debug?: boolean;
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : 'Unknown error');
}

async function delay(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadWithRetries<T>(
  loadFn: () => Promise<T>,
  options: LazyLoaderOptions
): Promise<T> {
  const retries = Math.max(0, options.retries ?? 0);
  const retryDelay = Math.max(0, options.retryDelay ?? 0);

  const attempt = async (remainingRetries: number): Promise<T> => {
    try {
      return await loadFn();
    } catch (error) {
      options.onError?.(error);
      if (remainingRetries <= 0) {
        throw error;
      }

      await delay(retryDelay);
      return attempt(remainingRetries - 1);
    }
  };

  return attempt(retries);
}

function createBaseLazyLoader<T>(
  loadFn: () => Promise<T>,
  options: LazyLoaderOptions
): LazyLoader<T> {
  let hasValue = false;
  let value!: T;
  let error: Error | undefined;

  let inflight: Promise<T> | null = null;
  let inflightShouldCacheError = false;

  const start = (shouldCacheError: boolean): Promise<T> => {
    if (hasValue) {
      return Promise.resolve(value);
    }

    if (error) {
      return Promise.reject(error);
    }

    if (inflight) {
      if (shouldCacheError) {
        inflightShouldCacheError = true;
      }
      return inflight;
    }

    inflightShouldCacheError = shouldCacheError;

    inflight = loadWithRetries(loadFn, options)
      .then((loaded) => {
        value = loaded;
        hasValue = true;
        return loaded;
      })
      .catch((e) => {
        const err = toError(e);
        if (inflightShouldCacheError) {
          error = err;
        } else if (options.debug) {
          // Preload errors are intentionally not cached.
          // Keep behavior silent unless debug is explicitly requested.
        }
        throw err;
      })
      .finally(() => {
        inflight = null;
      });

    return inflight;
  };

  return {
    load: () => start(true),
    preload: () => {
      void start(false).catch(() => {
        // Intentionally swallowed.
      });
    },
    reset: () => {
      hasValue = false;
      error = undefined;
      inflight = null;
      inflightShouldCacheError = false;
    },
    isLoaded: () => hasValue,
  };
}

export function createModuleLazyLoader<TModule>(
  importFn: () => Promise<TModule>,
  options: LazyLoaderOptions = {}
): LazyLoader<TModule> {
  return createBaseLazyLoader(() => importFn(), options);
}

export function createLazyLoader<TModule extends Record<string, unknown>, TExport = unknown>(
  importFn: () => Promise<TModule>,
  exportName: string,
  options: LazyLoaderOptions = {}
): LazyLoader<TExport> {
  return createBaseLazyLoader(async () => {
    const mod = await importFn();

    if (!mod || typeof mod !== 'object') {
      throw new Error('Module did not resolve to an object');
    }

    if (!(exportName in mod)) {
      throw new Error(`Export '${exportName}' not found in module`);
    }

    return mod[exportName] as TExport;
  }, options);
}

export function preloadAll(loaders: ReadonlyArray<LazyLoader<unknown>>): void {
  for (const loader of loaders) {
    loader.preload();
  }
}
