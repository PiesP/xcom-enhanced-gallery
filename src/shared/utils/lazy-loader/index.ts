export interface LazyLoader<T> {
  readonly load: () => Promise<T>;
  readonly preload: () => void;
  readonly reset: () => void;
  readonly isLoaded: () => boolean;
}

export interface LazyLoaderOptions {
  readonly retries?: number;
  readonly retryDelay?: number;
  readonly onError?: (error: unknown) => void;
}

const delayMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, Math.max(0, ms));
  });

export function createLazyLoader<
  TModule extends Record<string, unknown>,
  TExport extends keyof TModule,
>(
  importFn: () => Promise<TModule>,
  exportName: TExport,
  options?: LazyLoaderOptions
): LazyLoader<TModule[TExport]> {
  let loaded = false;
  let value: TModule[TExport] | undefined;
  let pending: Promise<TModule[TExport]> | null = null;

  const loadOnce = async (): Promise<TModule[TExport]> => {
    const module = await importFn();
    if (!(exportName in module)) {
      throw new Error(`Export '${String(exportName)}' not found`);
    }
    return module[exportName] as TModule[TExport];
  };

  const loadWithRetry = async (): Promise<TModule[TExport]> => {
    const retries = options?.retries ?? 0;
    const retryDelay = options?.retryDelay ?? 0;

    let attempt = 0;
    for (;;) {
      try {
        const result = await loadOnce();
        loaded = true;
        value = result;
        return result;
      } catch (error) {
        options?.onError?.(error);

        if (attempt >= retries) {
          throw error;
        }
        attempt++;
        if (retryDelay > 0) {
          await delayMs(retryDelay);
        }
      }
    }
  };

  return {
    load: async () => {
      if (loaded) {
        return value as TModule[TExport];
      }
      if (pending) {
        return pending;
      }

      pending = loadWithRetry().finally(() => {
        pending = null;
      });
      return pending;
    },
    preload: () => {
      void (async () => {
        try {
          await (pending ?? (pending = loadWithRetry().finally(() => (pending = null))));
        } catch {
          // ignore
        }
      })();
    },
    reset: () => {
      loaded = false;
      value = undefined;
      pending = null;
    },
    isLoaded: () => loaded,
  };
}

export function createModuleLazyLoader<TModule>(
  importFn: () => Promise<TModule>,
  options?: LazyLoaderOptions
): LazyLoader<TModule> {
  let loaded = false;
  let value: TModule | undefined;
  let pending: Promise<TModule> | null = null;

  const loadOnce = async (): Promise<TModule> => importFn();

  const loadWithRetry = async (): Promise<TModule> => {
    const retries = options?.retries ?? 0;
    const retryDelay = options?.retryDelay ?? 0;

    let attempt = 0;
    for (;;) {
      try {
        const result = await loadOnce();
        loaded = true;
        value = result;
        return result;
      } catch (error) {
        options?.onError?.(error);

        if (attempt >= retries) {
          throw error;
        }
        attempt++;
        if (retryDelay > 0) {
          await delayMs(retryDelay);
        }
      }
    }
  };

  return {
    load: async () => {
      if (loaded) {
        return value as TModule;
      }
      if (pending) {
        return pending;
      }
      pending = loadWithRetry().finally(() => {
        pending = null;
      });
      return pending;
    },
    preload: () => {
      void (async () => {
        try {
          await (pending ?? (pending = loadWithRetry().finally(() => (pending = null))));
        } catch {
          // ignore
        }
      })();
    },
    reset: () => {
      loaded = false;
      value = undefined;
      pending = null;
    },
    isLoaded: () => loaded,
  };
}

export function preloadAll(loaders: Array<Pick<LazyLoader<unknown>, 'preload'>>): void {
  for (const loader of loaders) {
    loader.preload();
  }
}
