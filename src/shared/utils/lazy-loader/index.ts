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

/**
 * Internal delay helper
 */
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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
  options: LazyLoaderOptions = {},
): LazyLoader<TModule[TExport]> {
  const { retries = 0, retryDelay = 100, debug = false, onError } = options;

  let state: LazyState<TModule[TExport]> = { status: 'idle' };

  const loadWithRetry = async (attempt = 0): Promise<TModule[TExport]> => {
    try {
      const module = await importFn();
      const exportValue = module[exportName];

      if (exportValue === undefined) {
        throw new Error(`Export '${String(exportName)}' not found in module`);
      }

      return exportValue;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        if (debug) {
          logger.debug(`[LazyLoader] Retry ${attempt + 1}/${retries} for '${String(exportName)}'`);
        }
        await delay(retryDelay);
        return loadWithRetry(attempt + 1);
      }

      throw err;
    }
  };

  const load = async (): Promise<TModule[TExport]> => {
    // Return cached value
    if (state.status === 'loaded') {
      return state.value;
    }

    // Return in-flight promise
    if (state.status === 'loading') {
      return state.promise;
    }

    // Re-throw cached error
    if (state.status === 'error') {
      throw state.error;
    }

    // Start loading
    if (debug) {
      logger.debug(`[LazyLoader] Loading '${String(exportName)}'...`);
    }

    const promise = loadWithRetry().then(
      (value) => {
        state = { status: 'loaded', value };
        if (debug) {
          logger.debug(`[LazyLoader] Loaded '${String(exportName)}'`);
        }
        return value;
      },
      (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        state = { status: 'error', error: err };
        onError?.(err);
        if (debug) {
          logger.error(`[LazyLoader] Failed to load '${String(exportName)}':`, err.message);
        }
        throw err;
      },
    );

    state = { status: 'loading', promise };
    return promise;
  };

  const isLoaded = (): boolean => state.status === 'loaded';

  const preload = (): void => {
    if (state.status === 'idle') {
      // Silently ignore errors in preload - they'll surface when load() is called
      void load().catch(() => {});
    }
  };

  const reset = (): void => {
    state = { status: 'idle' };
  };

  return { load, isLoaded, preload, reset };
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
  options: LazyLoaderOptions = {},
): LazyLoader<TModule> {
  const { retries = 0, retryDelay = 100, debug = false, onError } = options;

  let state: LazyState<TModule> = { status: 'idle' };

  const loadWithRetry = async (attempt = 0): Promise<TModule> => {
    try {
      return await importFn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        if (debug) {
          logger.debug(`[LazyLoader] Retry ${attempt + 1}/${retries} for module`);
        }
        await delay(retryDelay);
        return loadWithRetry(attempt + 1);
      }

      throw err;
    }
  };

  const load = async (): Promise<TModule> => {
    if (state.status === 'loaded') {
      return state.value;
    }

    if (state.status === 'loading') {
      return state.promise;
    }

    if (state.status === 'error') {
      throw state.error;
    }

    if (debug) {
      logger.debug('[LazyLoader] Loading module...');
    }

    const promise = loadWithRetry().then(
      (value) => {
        state = { status: 'loaded', value };
        if (debug) {
          logger.debug('[LazyLoader] Module loaded');
        }
        return value;
      },
      (error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        state = { status: 'error', error: err };
        onError?.(err);
        if (debug) {
          logger.error('[LazyLoader] Failed to load module:', err.message);
        }
        throw err;
      },
    );

    state = { status: 'loading', promise };
    return promise;
  };

  const isLoaded = (): boolean => state.status === 'loaded';

  const preload = (): void => {
    if (state.status === 'idle') {
      // Silently ignore errors in preload - they'll surface when load() is called
      void load().catch(() => {});
    }
  };

  const reset = (): void => {
    state = { status: 'idle' };
  };

  return { load, isLoaded, preload, reset };
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
  loaders: T,
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]['load']>> }> {
  const results = await Promise.all(loaders.map((loader) => loader.load()));
  return results as { [K in keyof T]: Awaited<ReturnType<T[K]['load']>> };
}
