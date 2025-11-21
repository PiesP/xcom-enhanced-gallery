/**
 * @fileoverview TDZ-safe Vendor API (Solid.js)
 * @description Safe vendor access API that solves TDZ issues through static import
 *
 * **Scope**: Vendor initialization and accessor functions (Phase 373+ Vendor Layer)
 * **Pattern**: Barrel export wrapper with @Safe suffix (Phase 309+ Service Layer)
 * **Principle**: Synchronous TDZ-safe access via StaticVendorManager singleton
 *
 * TDD Phase: GREEN - Guaranteed safe initialization and synchronous access (Solid.js migration)
 * Phase: 373 - Vendors API optimization (English-only, @internal marking, comprehensive docs)
 *
 * **Internal Implementation**:
 * - Single execution guarantee: `isInitializing` flag + `initializationPromise`
 * - Singleton management: `staticVendorManager.getInstance()`
 * - Error handling: Try-catch blocks with logger integration
 * - Cleanup support: Memory deallocation via `cleanupVendorsSafe()`
 *
 * **Do NOT import directly**:
 * ❌ `import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe'`
 * ✅ Use barrel export: `import { getSolid } from '@shared/external/vendors'`
 */

import { logger } from '@shared/logging';
import {
  StaticVendorManager,
  type SolidAPI,
  type SolidStoreAPI,
  type NativeDownloadAPI,
} from './vendor-manager-static';

// ================================
// Safe public API (Phase 373)
// ================================

const staticVendorManager = StaticVendorManager.getInstance();

// Initialization lock (prevent duplicate calls)
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize all vendors (guaranteed single execution)
 *
 * Ensures all required vendor libraries (Solid.js, Store) are loaded and cached.
 * Prevents duplicate initialization via `isInitializing` flag and `initializationPromise`.
 *
 * **Idempotent**: Safe to call multiple times - only first call performs initialization
 *
 * @example
 * ```typescript
 * import { initializeVendors } from '@shared/external/vendors';
 * await initializeVendors();
 * ```
 *
 * @throws {Error} If initialization fails (vendor loading error)
 * @internal Wrapper for {@link StaticVendorManager.initialize}
 */
export async function initializeVendorsSafe(): Promise<void> {
  if (staticVendorManager.getInitializationStatus().isInitialized) {
    logger.debug('Vendor initialization skipped; cache already ready.');
    return;
  }

  if (isInitializing && initializationPromise) {
    logger.debug('Vendor initialization already in progress; awaiting completion.');
    return initializationPromise;
  }

  isInitializing = true;

  try {
    logger.info('Vendor initialization started (Solid.js).');

    initializationPromise = staticVendorManager.initialize();
    await initializationPromise;

    logger.info('Vendor initialization completed (Solid.js).');
  } catch (error) {
    logger.error('Vendor initialization failed:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Solid.js library safe access (synchronous)
 *
 * Retrieves cached Solid.js core API ({@link SolidAPI}) for reactive primitives and components.
 * Performs lazy initialization if not yet initialized (Phase 373 fallback).
 *
 * **Available APIs**: createSignal, createEffect, createMemo, Show, For, render, etc.
 *
 * @returns {SolidAPI} Solid.js core reactive API
 * @throws {Error} If Solid.js is not available or initialization fails
 *
 * @example
 * ```typescript
 * import { getSolid } from '@shared/external/vendors';
 * const { createSignal, createEffect } = getSolid();
 * const [count, setCount] = createSignal(0);
 * ```
 *
 * @internal Wrapper for {@link StaticVendorManager.getSolid}
 */
export function getSolidSafe(): SolidAPI {
  try {
    return staticVendorManager.getSolid();
  } catch (error) {
    logger.error('Solid.js access failed:', error);
    throw new Error('Cannot use Solid.js library. Call initializeVendors() first.');
  }
}

/**
 * Solid.js Store safe access (synchronous)
 *
 * Retrieves cached Solid.js Store API ({@link SolidStoreAPI}) for reactive store management.
 * Performs lazy initialization if not yet initialized (Phase 373 fallback).
 *
 * **Available APIs**: createStore, produce (batch updates)
 *
 * @returns {SolidStoreAPI} Solid.js Store reactive API
 * @throws {Error} If Solid.js Store is not available or initialization fails
 *
 * @example
 * ```typescript
 * import { getSolidStore } from '@shared/external/vendors';
 * const { createStore, produce } = getSolidStore();
 * const [state, setState] = createStore({ count: 0 });
 * ```
 *
 * @internal Wrapper for {@link StaticVendorManager.getSolidStore}
 */
export function getSolidStoreSafe(): SolidStoreAPI {
  try {
    return staticVendorManager.getSolidStore();
  } catch (error) {
    logger.error('Solid.js Store access failed:', error);
    throw new Error('Cannot use Solid.js Store library. Call initializeVendors() first.');
  }
}

/**
 * Native download API access (synchronous, fallback for Tampermonkey)
 *
 * Retrieves {@link NativeDownloadAPI} for Blob-to-file downloads using browser native APIs.
 * Used when Tampermonkey GM_download is unavailable (e.g., test environment).
 *
 * **Methods**:
 * - `downloadBlob(blob, filename)`: Download Blob with filename
 * - `createDownloadUrl(blob)`: Create temporary download URL
 * - `revokeDownloadUrl(url)`: Release download URL (cleanup)
 *
 * **Memory Management**: Automatic URL cleanup via 60-second timeout
 *
 * @returns {NativeDownloadAPI} Native download implementation
 * @throws {Error} If native download API fails
 *
 * @example
 * ```typescript
 * import { getNativeDownload } from '@shared/external/vendors';
 * const api = getNativeDownload();
 * const blob = new Blob(['data'], { type: 'text/plain' });
 * api.downloadBlob(blob, 'file.txt');
 * ```
 *
 * **Preferred**: Use {@link DownloadService} from @shared/services (Phase 309+ Service Layer)
 *
 * @internal Wrapper for {@link StaticVendorManager.getNativeDownload}
 */
export const getNativeDownloadSafe = (): NativeDownloadAPI => {
  try {
    return staticVendorManager.getNativeDownload();
  } catch (error) {
    logger.error('Native download API access failed:', error);
    throw new Error(
      'Cannot access native download functionality. StaticVendorManager may not be initialized.'
    );
  }
};

/**
 * Validate all vendors (Solid.js, Store)
 *
 * Performs runtime validation that all required vendor libraries are accessible.
 * Returns result with validation status, loaded libraries, and any errors.
 *
 * @returns Validation result with success status and error details
 * @internal Advanced debugging - use {@link isVendorInitialized} for simple checks
 */
export const validateVendorsSafe = () => staticVendorManager.validateAll();

/**
 * Retrieve version information for all vendor libraries
 *
 * Returns frozen object with version strings for Solid.js and related libraries.
 * Used for debugging and diagnostic logging.
 *
 * @returns Version info object (frozen, immutable)
 * @internal Diagnostic API - not part of runtime code path
 */
export const getVendorVersionsSafe = () => staticVendorManager.getVersionInfo();

/**
 * Clean up all vendor resources and release memory
 *
 * Performs complete cleanup:
 * - Releases cached API objects
 * - Revokes any created download URLs
 * - Clears all timers
 * - Resets initialization state
 *
 * **Safe to call multiple times** - idempotent operation
 *
 * @internal Lifecycle method - called automatically on page unload via {@link registerVendorCleanupOnUnload}
 */
export const cleanupVendorsSafe = (): void => {
  staticVendorManager.cleanup();
  isInitializing = false;
  initializationPromise = null;
  logger.info('Vendor cleanup completed (all resources released)');
};

/**
 * Check if all vendors are initialized
 *
 * @returns true if all vendor APIs are available and cached, false otherwise
 */
export function isVendorsInitializedSafe(): boolean {
  return staticVendorManager.getInitializationStatus().isInitialized;
}

/**
 * Generate comprehensive vendor initialization report
 *
 * Returns status object with:
 * - Initialization completion status
 * - Cache size and available APIs
 * - Version information
 * - Initialization rate (percentage)
 * - Vendor counts (expected vs initialized)
 *
 * @returns Detailed initialization report for debugging/diagnostics
 * @internal Advanced API - use {@link isVendorsInitialized} for simple checks
 */
export function getVendorInitializationReportSafe() {
  const status = staticVendorManager.getInitializationStatus();
  const versions = getVendorVersionsSafe();

  const expectedVendors = ['solid', 'solid-store'] as const;
  const initializedCount = expectedVendors.filter(vendor =>
    status.availableAPIs.includes(vendor)
  ).length;
  const initializationRate = expectedVendors.length
    ? Math.round((initializedCount / expectedVendors.length) * 100)
    : 100;

  return {
    isInitialized: status.isInitialized,
    cacheSize: status.cacheSize,
    availableAPIs: status.availableAPIs,
    versions,
    initializationRate,
    totalCount: expectedVendors.length,
    initializedCount,
  };
}

/**
 * Query individual vendor initialization status
 *
 * Returns object with per-vendor initialization status:
 * - solid: Core Solid.js available
 * - solidStore: Solid Store API available
 *
 * @returns Per-vendor status object
 * @internal Use {@link isVendorInitialized} for checking specific vendors
 */
export function getVendorStatusesSafe() {
  const status = staticVendorManager.getInitializationStatus();

  if (!status.isInitialized) {
    return {
      solid: false,
      solidStore: false,
    };
  }

  return {
    solid: status.availableAPIs.includes('solid'),
    solidStore: status.availableAPIs.includes('solid-store'),
  };
}

/**
 * Check if a specific vendor is initialized
 *
 * @param vendorName - Vendor name to check ('solid' or 'solidStore')
 * @returns true if vendor is initialized and available
 *
 * @example
 * ```typescript
 * if (isVendorInitialized('solid')) {
 *   const { createSignal } = getSolid();
 * }
 * ```
 *
 * @internal Use for runtime capability checks
 */
export function isVendorInitializedSafe(vendorName: string): boolean {
  const statuses = getVendorStatusesSafe();

  switch (vendorName) {
    case 'solid':
      return statuses.solid;
    case 'solidStore':
      return statuses.solidStore;
    default:
      return false;
  }
}

/**
 * Register automatic vendor cleanup on page unload
 *
 * Attaches event listeners to `pagehide` (BFCache compatible) that automatically
 * clean up vendor resources when user navigates away or closes page.
 *
 * **Recommendation**: Call once during app initialization
 *
 * @param target - Event target (default: window if available)
 *
 * @example
 * ```typescript
 * import { registerVendorCleanupOnUnload } from '@shared/external/vendors';
 *
 * // Called during app bootstrap
 * registerVendorCleanupOnUnload();
 * ```
 *
 * **Lifecycle Integration**:
 * - Attached: `pagehide` event (fired before page is hidden)
 * - Not attached: `beforeunload` (breaks BFCache - Back-Forward Cache)
 * - Errors during cleanup are silently caught (page is already unloading)
 *
 * @internal Lifecycle management - use during bootstrap phase
 */
export function registerVendorCleanupOnUnloadSafe(
  target: Window | undefined = typeof window !== 'undefined' ? window : undefined
): void {
  try {
    if (!target) return;
    const handler = () => {
      try {
        cleanupVendorsSafe();
      } catch {
        // Cleanup errors during page unload are silently caught
        // (page is already being destroyed, errors are not actionable)
      }
    };
    // BFCache compatibility: Do NOT attach beforeunload (breaks back-forward cache)
    target.addEventListener('pagehide', handler);
  } catch {
    // Event listener registration failures are silently caught
    // (vendor cleanup will still work via StaticVendorManager.cleanup())
  }
}

/**
 * Reset vendor manager singleton state (testing only)
 *
 * Clears the singleton instance and all cached state. Use only in test cleanup
 * to ensure test isolation.
 *
 * **⚠️ DANGER**: Calling in production will break vendor access!
 *
 * @internal Testing only - marked with @internal to prevent accidental usage
 */
export const resetVendorManagerInstance = (): void => {
  StaticVendorManager.resetInstance();
  isInitializing = false;
  initializationPromise = null;
};
