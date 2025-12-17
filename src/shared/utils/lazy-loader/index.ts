/**
 * @fileoverview Lazy loading utilities for dynamic imports
 *
 * Provides type-safe, cached lazy loading with built-in error handling
 * and retry capabilities. Replaces repetitive `await import(...)` patterns.
 *
 * @example
 * ```typescript
 * // Define lazy loaders once
 * const loaders = {
 *   downloadService: createLazyLoader(
 *     () => import('@shared/services/download/download-orchestrator'),
 *     'DownloadOrchestrator'
 *   ),
 *   themeService: createLazyLoader(
 *     () => import('@shared/container/service-accessors'),
 *     'getThemeService'
 *   ),
 * };
 *
 * // Use anywhere - cached after first load
 * const DownloadOrchestrator = await loaders.downloadService.load();
 * ```
 *
 * @module shared/utils/lazy-loader
 */

import { delay as asyncDelay } from '@shared/async/delay';
import { logger } from '@shared/logging';

/**
 * State of a lazy-loaded module
 */
type LazyState<T> =
  | { status: 'idle' }
  | { status: 'loading'; promise: Promise<T> }
  | { status: 'loaded'; value: T }
  | { status: 'error'; error: Error };

/**
 * Options for lazy loader configuration
 */
export interface LazyLoaderOptions {
  /**
   * Number of retry attempts on failure
   * @default 0
   */
  readonly retries?: number;
  /**
   * Delay between retries in milliseconds
   * @default 100
   */
  readonly retryDelay?: number;
  /**
   * Whether to log loading events
   * @default false
   */
  readonly debug?: boolean;
  /**
   * Custom error handler
   */
  readonly onError?: (error: Error) => void;
}

/**
 * Result of a lazy loader
 */
export interface LazyLoader<T> {
  /**
   * Load and return the cached module export
   * @returns Promise resolving to the exported value
   */
  readonly load: () => Promise<T>;
  /**
   * Check if the module has been loaded
   */
  readonly isLoaded: () => boolean;
  /**
   * Preload the module without blocking
   */
  readonly preload: () => void;
  /**
   * Reset the loader state (mainly for testing)
   */
  readonly reset: () => void;
}

function createRetriableLoad<T>(
  loadOnce: () => Promise<T>,
  options: {
    readonly retries: number;
    readonly retryDelay: number;
    readonly debug: boolean;
    readonly retryLabel: string;
  }
): () => Promise<T> {
  const { retries, retryDelay, debug, retryLabel } = options;

  const run = async (attempt = 0): Promise<T> => {
    try {
      return await loadOnce();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        if (debug) {
          logger.debug(`[LazyLoader] Retry ${attempt + 1}/${retries} for ${retryLabel}`);
        }
        await asyncDelay(retryDelay);
        return run(attempt + 1);
      }

      throw err;
    }
  };

  return () => run(0);
}

function createLazyLoaderStateMachine<T>(
  loadWithRetry: () => Promise<T>,
  debugLabel: string,
  options: LazyLoaderOptions
): LazyLoader<T> {
  const { debug = false, onError } = options;

  let state: LazyState<T> = { status: 'idle' };

  const startLoading = (cacheError: boolean): Promise<T> => {
    // Return cached value
    if (state.status === 'loaded') {
      return Promise.resolve(state.value);
    }

    // Return in-flight promise
    if (state.status === 'loading') {
      return state.promise;
    }

    // Re-throw cached error
    if (state.status === 'error') {
      return Promise.reject(state.error);
    }

    // Start loading
    if (debug) {
      logger.debug(`[LazyLoader] Loading ${debugLabel}...`);
    }

    const promise = loadWithRetry().then(
      (value) => {
        state = { status: 'loaded', value };
        if (debug) {
          logger.debug(`[LazyLoader] Loaded ${debugLabel}`);
        }
        return value;
      },
      (error) => {
        const err = error instanceof Error ? error : new Error(String(error));

        if (cacheError) {
          state = { status: 'error', error: err };
          onError?.(err);
        } else {
          // Preload should not poison the loader state.
          state = { status: 'idle' };
        }

        if (debug) {
          logger.error(`[LazyLoader] Failed to load ${debugLabel}:`, err.message);
        }

        throw err;
      }
    );

    state = { status: 'loading', promise };
    return promise;
  };

  const load = async (): Promise<T> => {
    return startLoading(true);
  };

  const isLoaded = (): boolean => state.status === 'loaded';

  const preload = (): void => {
    if (state.status === 'idle') {
      // Preload should not poison the loader state on transient failures.
      void startLoading(false).catch(() => {});
    }
  };

  const reset = (): void => {
    state = { status: 'idle' };
  };

  return { load, isLoaded, preload, reset };
}

/**
 * Creates a lazy loader for a dynamic import
 *
 * @param importFn - Function that returns the dynamic import promise
 * @param exportName - Name of the export to extract from the module
 * @param options - Loader configuration
 * @returns LazyLoader instance
 *
 * @example
 * ```typescript
 * const loader = createLazyLoader(
 *   () => import('@shared/services/download/download-orchestrator'),
 *   'DownloadOrchestrator'
 * );
 *
 * const DownloadOrchestrator = await loader.load();
 * ```
 */
export function createLazyLoader<
  TModule extends Record<string, unknown>,
  TExport extends keyof TModule,
>(
  importFn: () => Promise<TModule>,
  exportName: TExport,
  options: LazyLoaderOptions = {}
): LazyLoader<TModule[TExport]> {
  const { retries = 0, retryDelay = 100, debug = false } = options;

  const exportLabel = `'${String(exportName)}'`;
  const loadOnce = async (): Promise<TModule[TExport]> => {
    const module = await importFn();
    const exportValue = module[exportName];

    if (exportValue === undefined) {
      throw new Error(`Export '${String(exportName)}' not found in module`);
    }

    return exportValue;
  };

  const loadWithRetry = createRetriableLoad(loadOnce, {
    retries,
    retryDelay,
    debug,
    retryLabel: exportLabel,
  });

  return createLazyLoaderStateMachine(loadWithRetry, exportLabel, options);
}

/**
 * Creates a lazy loader for a module (no specific export extraction)
 *
 * @param importFn - Function that returns the dynamic import promise
 * @param options - Loader configuration
 * @returns LazyLoader instance for the entire module
 *
 * @example
 * ```typescript
 * const stylesLoader = createModuleLazyLoader(
 *   () => import('./styles/globals')
 * );
 *
 * await stylesLoader.load();
 * ```
 */
export function createModuleLazyLoader<TModule>(
  importFn: () => Promise<TModule>,
  options: LazyLoaderOptions = {}
): LazyLoader<TModule> {
  const { retries = 0, retryDelay = 100, debug = false } = options;

  const moduleLabel = 'module';
  const loadWithRetry = createRetriableLoad(importFn, {
    retries,
    retryDelay,
    debug,
    retryLabel: moduleLabel,
  });

  return createLazyLoaderStateMachine(loadWithRetry, moduleLabel, options);
}

/**
 * Batch preload multiple lazy loaders
 *
 * @param loaders - Array of lazy loaders to preload
 *
 * @example
 * ```typescript
 * preloadAll([
 *   loaders.downloadService,
 *   loaders.themeService,
 * ]);
 * ```
 */
export function preloadAll(loaders: ReadonlyArray<LazyLoader<unknown>>): void {
  for (const loader of loaders) {
    loader.preload();
  }
}

/**
 * Wait for multiple lazy loaders to complete
 *
 * @param loaders - Array of lazy loaders to await
 * @returns Promise resolving when all loaders complete
 *
 * @example
 * ```typescript
 * await loadAll([
 *   loaders.downloadService,
 *   loaders.themeService,
 * ]);
 * ```
 */
export async function loadAll<T extends readonly LazyLoader<unknown>[]>(
  loaders: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]['load']>> }> {
  const results = await Promise.all(loaders.map((loader) => loader.load()));
  return results as { [K in keyof T]: Awaited<ReturnType<T[K]['load']>> };
}
