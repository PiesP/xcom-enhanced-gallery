/**
 * @fileoverview Static vendor manager (Solid-only)
 * @description Stage D Phase 5 — Removes legacy Preact dependencies and exposes SolidJS vendors.
 */

import { logger } from '@shared/logging';

import * as solid from 'solid-js';
import * as solidStore from 'solid-js/store';
import * as solidWeb from 'solid-js/web';

import {
  createDeprecatedFflateApi,
  warnFflateDeprecated,
  type FflateAPI,
  FFLATE_REMOVAL_MESSAGE,
} from './fflate-deprecated';

const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

export interface SolidCoreAPI {
  createSignal: typeof solid.createSignal;
  createEffect: typeof solid.createEffect;
  createMemo: typeof solid.createMemo;
  createRoot: typeof solid.createRoot;
  createComputed: typeof solid.createComputed;
  createComponent: typeof solid.createComponent;
  mergeProps: typeof solid.mergeProps;
  splitProps: typeof solid.splitProps;
  onCleanup: typeof solid.onCleanup;
  batch: typeof solid.batch;
  untrack: typeof solid.untrack;
  createContext: typeof solid.createContext;
  useContext: typeof solid.useContext;
  Show: typeof solid.Show;
}

export interface SolidStoreAPI {
  createStore: typeof solidStore.createStore;
  produce: typeof solidStore.produce;
  reconcile: typeof solidStore.reconcile;
  unwrap: typeof solidStore.unwrap;
}

export interface SolidWebAPI {
  render: typeof solidWeb.render;
}

export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;

  private readonly vendors = {
    solid,
    solidStore,
    solidWeb,
  } as const;

  private readonly deprecatedFflateApi: FflateAPI = createDeprecatedFflateApi();

  private readonly apiCache = new Map<string, unknown>();
  private readonly createdUrls = new Set<string>();
  private readonly urlTimers = new Map<string, number>();

  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    logger.debug('StaticVendorManager: Solid-only instance created');
  }

  public static getInstance(): StaticVendorManager {
    StaticVendorManager.instance ??= new StaticVendorManager();
    return StaticVendorManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      logger.debug('StaticVendorManager: initialization start');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
      logger.info('✅ StaticVendorManager: Solid vendors ready');
    } catch (error) {
      logger.error('❌ StaticVendorManager: initialization failed', error);
      throw error;
    }
  }

  private validateStaticImports(): void {
    if (typeof this.vendors.solid.createSignal !== 'function') {
      throw new Error('SolidJS core library validation failed');
    }

    if (typeof this.vendors.solidStore.createStore !== 'function') {
      throw new Error('SolidJS store library validation failed');
    }

    if (typeof this.vendors.solidWeb.render !== 'function') {
      throw new Error('SolidJS web renderer validation failed');
    }

    logger.debug('✅ Solid vendor validation complete');
  }

  private cacheAPIs(): void {
    const solidCoreAPI: SolidCoreAPI = {
      createSignal: this.vendors.solid.createSignal,
      createEffect: this.vendors.solid.createEffect,
      createMemo: this.vendors.solid.createMemo,
      createRoot: this.vendors.solid.createRoot,
      createComputed: this.vendors.solid.createComputed,
      createComponent: this.vendors.solid.createComponent,
      mergeProps: this.vendors.solid.mergeProps,
      splitProps: this.vendors.solid.splitProps,
      onCleanup: this.vendors.solid.onCleanup,
      batch: this.vendors.solid.batch,
      untrack: this.vendors.solid.untrack,
      createContext: this.vendors.solid.createContext,
      useContext: this.vendors.solid.useContext,
      Show: this.vendors.solid.Show,
    };

    const solidStoreAPI: SolidStoreAPI = {
      createStore: this.vendors.solidStore.createStore,
      produce: this.vendors.solidStore.produce,
      reconcile: this.vendors.solidStore.reconcile,
      unwrap: this.vendors.solidStore.unwrap,
    };

    const solidWebAPI: SolidWebAPI = {
      render: this.vendors.solidWeb.render,
    };

    this.apiCache.set('solid-core', solidCoreAPI);
    this.apiCache.set('solid-store', solidStoreAPI);
    this.apiCache.set('solid-web', solidWebAPI);

    logger.debug('✅ Solid vendor APIs cached');
  }

  public getFflate(): FflateAPI {
    warnFflateDeprecated('StoreZipWriter handles ZIP creation.');
    logger.debug(`[Vendors] ${FFLATE_REMOVAL_MESSAGE}`);
    return this.deprecatedFflateApi;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      logger.warn('StaticVendorManager accessed before initialization – performing lazy init');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }
  }

  public getSolidCore(): SolidCoreAPI {
    this.ensureInitialized();
    const api = this.apiCache.get('solid-core') as SolidCoreAPI | undefined;
    if (!api) {
      throw new Error('SolidJS core API unavailable');
    }
    return api;
  }

  public getSolidStore(): SolidStoreAPI {
    this.ensureInitialized();
    const api = this.apiCache.get('solid-store') as SolidStoreAPI | undefined;
    if (!api) {
      throw new Error('SolidJS store API unavailable');
    }
    return api;
  }

  public getSolidWeb(): SolidWebAPI {
    this.ensureInitialized();
    const api = this.apiCache.get('solid-web') as SolidWebAPI | undefined;
    if (!api) {
      throw new Error('SolidJS web API unavailable');
    }
    return api;
  }

  public getNativeDownload(): NativeDownloadAPI {
    return {
      downloadBlob: (blob: Blob, filename: string): void => {
        let url: string | null = null;
        try {
          url = URL.createObjectURL(blob);
          this.createdUrls.add(url);

          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          logger.debug('Native download complete', { filename });
        } catch (error) {
          logger.error('Native download failed', error);
          throw error;
        } finally {
          if (url) {
            try {
              URL.revokeObjectURL(url);
              this.createdUrls.delete(url);
            } catch (revokeError) {
              logger.warn('URL revoke failed', revokeError);
            }
          }
        }
      },

      createDownloadUrl: (blob: Blob): string => {
        const url = URL.createObjectURL(blob);
        this.createdUrls.add(url);

        const timerId = window.setTimeout(() => {
          if (!this.createdUrls.has(url)) {
            return;
          }
          try {
            URL.revokeObjectURL(url);
            this.createdUrls.delete(url);
          } catch (error) {
            logger.warn('Automatic URL cleanup failed', error);
          } finally {
            this.urlTimers.delete(url);
          }
        }, MEMORY_CONSTANTS.URL_CLEANUP_TIMEOUT);

        this.urlTimers.set(url, timerId);
        return url;
      },

      revokeDownloadUrl: (url: string): void => {
        try {
          const timerId = this.urlTimers.get(url);
          if (timerId) {
            clearTimeout(timerId);
            this.urlTimers.delete(url);
          }
          URL.revokeObjectURL(url);
          this.createdUrls.delete(url);
        } catch (error) {
          logger.warn('URL revoke failed', error);
        }
      },
    } satisfies NativeDownloadAPI;
  }

  public async validateAll(): Promise<{
    success: boolean;
    loadedLibraries: string[];
    errors: string[];
    skippedLibraries: string[];
  }> {
    const loadedLibraries: string[] = [];
    const errors: string[] = [];
    const skippedLibraries = ['fflate'];

    logger.info(
      '[Vendors] Skipping fflate validation: dependency removed in favor of StoreZipWriter.'
    );

    try {
      this.getSolidCore();
      loadedLibraries.push('SolidCore');
    } catch (error) {
      errors.push(`SolidCore: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getSolidStore();
      loadedLibraries.push('SolidStore');
    } catch (error) {
      errors.push(`SolidStore: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getSolidWeb();
      loadedLibraries.push('SolidWeb');
    } catch (error) {
      errors.push(`SolidWeb: ${error instanceof Error ? error.message : String(error)}`);
    }

    const success = errors.length === 0;

    if (success) {
      logger.info('Solid vendor validation completed', { loadedLibraries });
    } else {
      logger.error('Solid vendor validation errors', { errors });
    }

    return { success, loadedLibraries, errors, skippedLibraries };
  }

  public getVersionInfo() {
    return Object.freeze({
      fflate: 'removed',
      solid: '1.9.3',
      solidStore: '1.9.3',
      solidWeb: '1.9.3',
    });
  }

  public getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      hasInitializationPromise: !!this.initializationPromise,
      cacheSize: this.apiCache.size,
      availableAPIs: Array.from(this.apiCache.keys()),
    } as const;
  }

  public cleanup(): void {
    this.urlTimers.forEach(timerId => {
      clearTimeout(timerId);
    });
    this.urlTimers.clear();

    this.createdUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.warn('URL cleanup error', error);
      }
    });
    this.createdUrls.clear();

    this.apiCache.clear();
    this.isInitialized = false;
    this.initializationPromise = null;

    logger.debug('StaticVendorManager: cleanup complete');
  }

  public static resetInstance(): void {
    if (StaticVendorManager.instance) {
      StaticVendorManager.instance.cleanup();
      StaticVendorManager.instance = null;
    }
  }
}

export type { FflateAPI } from './fflate-deprecated';
