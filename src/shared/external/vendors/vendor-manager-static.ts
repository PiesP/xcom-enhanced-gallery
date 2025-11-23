/**
 * @fileoverview Static Import-based Safe Vendor Manager (Solid.js)
 * @description Static import-based implementation for safe vendor initialization without TDZ issues
 *
 * **Purpose**: TDZ-safe singleton manager for Solid.js vendor loading and caching (Phase 373)
 * **Pattern**: Static import + Singleton + Service Layer (Phase 309+)
 * **Principle**: All vendor access through cached API objects, not direct imports
 *
 * **Lifecycle**:
 * 1. Static imports (top of file): All Solid.js modules imported at parse time (no TDZ)
 * 2. Singleton creation: First getInstance() call creates StaticVendorManager
 * 3. Initialization: First initialize() call caches APIs (single execution guarantee)
 * 4. Access: All getSolid()/getSolidStore() calls return cached objects
 * 5. Cleanup: cleanup() releases all resources (timers, URLs, cache)
 *
 * **Memory Management** (Phase 373):
 * - API Cache: {@link apiCache} stores SolidAPI, SolidStoreAPI (persistent)
 * - URL Tracking: {@link createdUrls} tracks download URLs for cleanup
 * - Timer Tracking: {@link urlTimers} maps URL→timerId for cleanup
 * - Cleanup Interval: 60s auto-revoke for created URLs (prevents memory leak)
 *
 * **TDD Phase**: GREEN - Guaranteed safe initialization and synchronous access (Solid.js migration)
 * **Phase**: 373 - Vendors layer optimization (English-only, @internal marking)
 *
 * **Do NOT import directly**:
 * ❌ `import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static'`
 * ✅ Use barrel export: `import { getSolid } from '@shared/external/vendors'`
 */

import { logger } from '@shared/logging';
import { globalTimerManager } from '@shared/utils/timer-management';

// 정적 import로 Solid.js 라이브러리를 안전하게 로드
import {
  createSignal,
  createEffect,
  createMemo,
  createResource,
  createContext,
  useContext,
  batch,
  untrack,
  on,
  onMount,
  onCleanup,
  Show,
  For,
  Switch,
  Match,
  Index,
  ErrorBoundary,
  Suspense,
  lazy,
  children as resolveChildren,
  mergeProps,
  splitProps,
  createRoot,
  createComponent,
} from 'solid-js';

import { render } from 'solid-js/web';
import { createStore, produce } from 'solid-js/store';

const URL_CLEANUP_TIMEOUT = 60000;

// 타입 정의들 (Solid.js)
export interface SolidAPI {
  render: typeof render;
  createSignal: typeof createSignal;
  createEffect: typeof createEffect;
  createMemo: typeof createMemo;
  createStore: typeof createStore;
  produce: typeof produce;
  createResource: typeof createResource;
  createContext: typeof createContext;
  useContext: typeof useContext;
  batch: typeof batch;
  untrack: typeof untrack;
  on: typeof on;
  onMount: typeof onMount;
  onCleanup: typeof onCleanup;
  Show: typeof Show;
  For: typeof For;
  Switch: typeof Switch;
  Match: typeof Match;
  Index: typeof Index;
  ErrorBoundary: typeof ErrorBoundary;
  Suspense: typeof Suspense;
  lazy: typeof lazy;
  children: typeof resolveChildren;
  mergeProps: typeof mergeProps;
  splitProps: typeof splitProps;
  createRoot: typeof createRoot;
  createComponent: typeof createComponent;
}

export interface SolidStoreAPI {
  createStore: typeof createStore;
  produce: typeof produce;
}

export type JSXElement = import('solid-js').JSX.Element;
export type VNode = import('solid-js').JSX.Element;
export type ComponentChildren = import('solid-js').JSX.Element;

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// ================================
// Static Vendor Manager (TDZ-safe, Solid.js)
// ================================

/**
 * Static-import-based Solid.js Vendor Manager
 *
 * Ensures safe vendor access through static imports at module parse time (no TDZ issues).
 * Singleton pattern guarantees single instance and initialization.
 *
 * **Key Features**:
 * - TDZ-safe: All Solid.js modules imported via static import (top of file)
 * - Singleton: First getInstance() creates instance, subsequent calls reuse
 * - Single init: initialize() guarantee - called once via initializationPromise
 * - Lazy init: getSolid()/getSolidStore() trigger init if not done
 * - Memory safe: Automatic URL cleanup via 60s timeout
 * - Test safe: resetInstance() for test cleanup
 *
 * @internal Implementation detail - access only via barrel export {@link getSolid}, {@link getSolidStore}
 */
export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;

  // Statically loaded Solid.js APIs (no TDZ risk)
  // All Solid.js modules imported at parse time (top of file)
  private readonly vendors = {
    solid: {
      render,
      createSignal,
      createEffect,
      createMemo,
      createStore,
      produce,
      createResource,
      createContext,
      useContext,
      batch,
      untrack,
      on,
      onMount,
      onCleanup,
      Show,
      For,
      Switch,
      Match,
      Index,
      ErrorBoundary,
      Suspense,
      lazy,
      children: resolveChildren,
      mergeProps,
      splitProps,
      createRoot,
      createComponent,
    },
    store: {
      createStore,
      produce,
    },
  };

  // Validated API cache (persistent across initialization)
  // Stores SolidAPI and SolidStoreAPI after initialization
  private readonly apiCache = new Map<string, unknown>();

  // Download URL tracking (for cleanup on page unload)
  // Prevents memory leaks from URL.createObjectURL()
  private readonly createdUrls = new Set<string>();

  // Timer tracking (maps URL → timerId for 60s auto-cleanup)
  // Ensures auto-revoke via globalTimerManager.setTimeout()
  private readonly urlTimers = new Map<string, number>();

  // Initialization state
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Private constructor (Singleton pattern)
   * @internal Use getInstance() instead
   */
  private constructor() {
    logger.debug('StaticVendorManager: Creating singleton instance (Solid.js)');
  }

  /**
   * Get or create singleton instance
   *
   * @returns Singleton instance of StaticVendorManager
   * @internal Use barrel export {@link getSolid} instead
   */
  public static getInstance(): StaticVendorManager {
    StaticVendorManager.instance ??= new StaticVendorManager();
    return StaticVendorManager.instance;
  }

  /**
   * Initialize all vendors (guaranteed single execution)
   *
   * Validates static imports and caches all vendor APIs.
   * Subsequent calls immediately return (idempotent via initializationPromise).
   *
   * **Single Execution**: Even with concurrent calls, initialization runs exactly once
   * via Promise reuse pattern:
   * ```typescript
   * if (this.initializationPromise) return this.initializationPromise;
   * this.initializationPromise = this.performInitialization();
   * ```
   *
   * @returns Promise that resolves when all vendors are cached
   * @throws {Error} If any vendor validation fails
   * @internal Use barrel export {@link initializeVendors} instead
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform actual initialization (private helper)
   *
   * Steps:
   * 1. Validate all static imports (Solid.js, Store)
   * 2. Cache API objects for synchronous access
   * 3. Set isInitialized = true
   * 4. Log completion
   *
   * @private Implementation detail
   * @throws {Error} If validation fails
   */
  private async performInitialization(): Promise<void> {
    try {
      logger.debug('StaticVendorManager: Initialization started (Solid.js)');

      // Validate static imports before caching
      this.validateStaticImports();

      // Cache API objects for synchronous access
      this.cacheAPIs();

      this.isInitialized = true;
      logger.info('StaticVendorManager: Solid.js vendors initialized and cached');
    } catch (error) {
      logger.error('StaticVendorManager: Initialization failed:', error);
      throw error;
    }
  }

  private ensureInitializedSync(): void {
    if (this.isInitialized) {
      return;
    }

    const log = import.meta.env.MODE === 'test' ? logger.debug : logger.warn;
    log('StaticVendorManager not initialized. Performing synchronous warm-up.');

    this.validateStaticImports();
    this.cacheAPIs();
    this.isInitialized = true;
  }

  /**
   * Validate all static imports are working (Solid.js, Store)
   *
   * Checks:
   * - Solid.js createSignal function exists and is callable
   * - Store createStore function exists and is callable
   *
   * @private Implementation detail
   * @throws {Error} If any validation fails
   */
  private validateStaticImports(): void {
    // Validate Solid.js core functions
    if (!this.vendors.solid.createSignal || typeof this.vendors.solid.createSignal !== 'function') {
      throw new Error('Solid.js validation failed: createSignal not found or not callable');
    }

    // Validate Solid.js Store functions
    if (!this.vendors.store.createStore || typeof this.vendors.store.createStore !== 'function') {
      throw new Error('Solid.js Store validation failed: createStore not found or not callable');
    }

    logger.debug('StaticVendorManager: static import validation succeeded');
  }

  /**
   * Cache all vendor APIs for synchronous access
   *
   * Creates SolidAPI and SolidStoreAPI objects from static imports and stores in cache.
   * After caching, getSolid() and getSolidStore() can access APIs synchronously.
   *
   * @private Implementation detail
   */
  private cacheAPIs(): void {
    // Solid.js core API cache
    const solidAPI: SolidAPI = {
      render: this.vendors.solid.render,
      createSignal: this.vendors.solid.createSignal,
      createEffect: this.vendors.solid.createEffect,
      createMemo: this.vendors.solid.createMemo,
      createStore: this.vendors.solid.createStore,
      produce: this.vendors.solid.produce,
      createResource: this.vendors.solid.createResource,
      createContext: this.vendors.solid.createContext,
      useContext: this.vendors.solid.useContext,
      batch: this.vendors.solid.batch,
      untrack: this.vendors.solid.untrack,
      on: this.vendors.solid.on,
      onMount: this.vendors.solid.onMount,
      onCleanup: this.vendors.solid.onCleanup,
      Show: this.vendors.solid.Show,
      For: this.vendors.solid.For,
      Switch: this.vendors.solid.Switch,
      Match: this.vendors.solid.Match,
      Index: this.vendors.solid.Index,
      ErrorBoundary: this.vendors.solid.ErrorBoundary,
      Suspense: this.vendors.solid.Suspense,
      lazy: this.vendors.solid.lazy,
      children: this.vendors.solid.children,
      mergeProps: this.vendors.solid.mergeProps,
      splitProps: this.vendors.solid.splitProps,
      createRoot: this.vendors.solid.createRoot,
      createComponent: this.vendors.solid.createComponent,
    };

    // Solid.js Store API cache
    const solidStoreAPI: SolidStoreAPI = {
      createStore: this.vendors.store.createStore,
      produce: this.vendors.store.produce,
    };

    // Store in cache for synchronous access
    this.apiCache.set('solid', solidAPI);
    this.apiCache.set('solid-store', solidStoreAPI);

    logger.debug('StaticVendorManager: vendor APIs cached');
  }

  /**
   * Get Solid.js core API (synchronous access)
   *
   * Returns cached SolidAPI object for reactive primitives and components.
   * Performs lazy initialization if not yet initialized.
   *
   * **APIs Available**: createSignal, createEffect, createMemo, Show, For, render, etc.
   *
   * @returns {@link SolidAPI} cached object
   * @throws {Error} If Solid.js API not found in cache
   * @internal Use barrel export {@link getSolid} instead
   */
  public getSolid(): SolidAPI {
    this.ensureInitializedSync();

    const api = this.apiCache.get('solid') as SolidAPI;
    if (!api) {
      throw new Error(
        'Solid.js API not found in cache. StaticVendorManager may not be initialized.'
      );
    }
    return api;
  }

  /**
   * Get Solid.js Store API (synchronous access)
   *
   * Returns cached SolidStoreAPI object for reactive store management.
   * Performs lazy initialization if not yet initialized.
   *
   * **APIs Available**: createStore, produce (batch updates)
   *
   * @returns {@link SolidStoreAPI} cached object
   * @throws {Error} If Solid.js Store API not found in cache
   * @internal Use barrel export {@link getSolidStore} instead
   */
  public getSolidStore(): SolidStoreAPI {
    this.ensureInitializedSync();

    const api = this.apiCache.get('solid-store') as SolidStoreAPI;
    if (!api) {
      throw new Error(
        'Solid.js Store API not found in cache. StaticVendorManager may not be initialized.'
      );
    }
    return api;
  }

  /**
   * Get native download API (memory-managed Blob download)
   *
   * Returns {@link NativeDownloadAPI} for browser-native Blob downloads.
   * Used as fallback when Tampermonkey GM_download unavailable (test environment).
   *
   * **Memory Management** (Phase 373):
   * - URL tracking: {@link createdUrls} stores all created URLs
   * - Auto-cleanup: 60s timeout via {@link globalTimerManager} releases URLs
   * - Timer tracking: {@link urlTimers} maps URL→timerId for cleanup
   *
   * **Methods**:
   * - `downloadBlob(blob, filename)`: Create download link and trigger click
   * - `createDownloadUrl(blob)`: Create URL with auto-cleanup on 60s timeout
   * - `revokeDownloadUrl(url)`: Manual cleanup (cancels auto-timer)
   *
   * @returns {@link NativeDownloadAPI} implementation
   * @internal Use {@link DownloadService} from @shared/services (Phase 309+)
   */
  public getNativeDownload(): NativeDownloadAPI {
    return {
      downloadBlob: (_blob: Blob, _filename: string): void => {
        logger.warn('Native download fallback removed. Use DownloadService.');
      },

      createDownloadUrl: (blob: Blob): string => {
        const url = URL.createObjectURL(blob);
        this.createdUrls.add(url);

        // Auto-cleanup after 60 seconds (Phase 373 memory management improvement)
        const timerId = globalTimerManager.setTimeout(() => {
          if (this.createdUrls.has(url)) {
            try {
              URL.revokeObjectURL(url);
              this.createdUrls.delete(url);
            } catch (error) {
              logger.warn('Automatic URL cleanup failed:', error);
            }
          }
        }, URL_CLEANUP_TIMEOUT);

        this.urlTimers.set(url, timerId);

        return url;
      },

      revokeDownloadUrl: (url: string): void => {
        try {
          // Cancel auto-cleanup timer
          const timerId = this.urlTimers.get(url);
          if (timerId) {
            globalTimerManager.clearTimeout(timerId);
            this.urlTimers.delete(url);
          }

          URL.revokeObjectURL(url);
          this.createdUrls.delete(url);
        } catch (error) {
          logger.warn('URL revocation failed:', error);
        }
      },
    };
  }

  /**
   * Validate all vendor libraries (Solid.js, Store)
   *
   * Performs runtime validation and returns detailed status with:
   * - Validation success flag
   * - Loaded vendor list
   * - Error list (if any)
   *
   * @returns Validation result object
   * @internal Advanced API - use {@link isVendorInitialized} for simple checks
   */
  public async validateAll(): Promise<{
    success: boolean;
    loadedLibraries: string[];
    errors: string[];
  }> {
    const loadedLibraries: string[] = [];
    const errors: string[] = [];

    try {
      this.getSolid();
      loadedLibraries.push('Solid.js');
    } catch (error) {
      errors.push(`Solid.js: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getSolidStore();
      loadedLibraries.push('SolidStore');
    } catch (error) {
      errors.push(`SolidStore: ${error instanceof Error ? error.message : String(error)}`);
    }

    const success = errors.length === 0;

    if (success) {
      logger.info('All vendor libraries validated successfully', { loadedLibraries });
    } else {
      logger.error('Vendor library validation errors detected', { errors });
    }

    return { success, loadedLibraries, errors };
  }

  /**
   * Get version information for all vendor libraries
   *
   * Returns frozen object with version strings for Solid.js, Signals, etc.
   * Used for debugging and diagnostic logging.
   *
   * @returns Version info object (immutable via Object.freeze)
   * @internal Diagnostic API - not part of runtime code path
   */
  public getVersionInfo() {
    return Object.freeze({
      solid: '1.9.9',
      signals: '2.3.1',
      motion: 'removed', // Motion One completely removed (Phase 372+)
    });
  }

  /**
   * Get initialization status and diagnostic information
   *
   * Returns object with:
   * - `isInitialized`: Initialization completion status
   * - `hasInitializationPromise`: Pending initialization
   * - `cacheSize`: Number of cached APIs
   * - `availableAPIs`: Array of cached API keys
   *
   * @returns Status object for diagnostics
   * @internal Use {@link isVendorsInitialized} for simple boolean check
   */
  public getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      hasInitializationPromise: !!this.initializationPromise,
      cacheSize: this.apiCache.size,
      availableAPIs: Array.from(this.apiCache.keys()),
    };
  }

  /**
   * Clean up all vendor resources (memory deallocation)
   *
   * Performs complete cleanup:
   * - Clear all timers (via globalTimerManager)
   * - Revoke all download URLs
   * - Clear API cache
   * - Reset initialization state
   *
   * **Safe to call multiple times** (idempotent)
   *
   * @internal Lifecycle method - called by {@link cleanupVendors} or page unload
   */
  public cleanup(): void {
    // Clear all timers
    this.urlTimers.forEach(timerId => {
      globalTimerManager.clearTimeout(timerId);
    });
    this.urlTimers.clear();

    // Revoke all download URLs
    this.createdUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.warn('URL revocation during cleanup failed:', error);
      }
    });
    this.createdUrls.clear();

    // Clear API cache
    this.apiCache.clear();

    // Reset initialization state
    this.isInitialized = false;
    this.initializationPromise = null;

    logger.debug('StaticVendorManager: Cleanup completed (all resources released)');
  }

  /**
   * Reset singleton instance (testing only)
   *
   * Clears the singleton instance and all cached state. Use only in test cleanup
   * to ensure test isolation.
   *
   * **⚠️ DANGER**: Calling in production will break vendor access!
   *
   * @internal Testing only - marked with @internal to prevent accidental usage
   */
  public static resetInstance(): void {
    if (StaticVendorManager.instance) {
      StaticVendorManager.instance.cleanup();
      StaticVendorManager.instance = null;
    }
  }
}
