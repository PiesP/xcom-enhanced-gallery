/**
 * Vendor API Layer - Solid.js and external libraries getter
 *
 * **Purpose**: TDZ-safe static import for Solid.js access (Phase 309+ Service Layer)
 * **Pattern**: Getter functions for synchronous access (getSolid, getSolidStore, etc.)
 * **Principle**: Use barrel exports only, forbid direct imports of internal files
 *
 * **Internal Implementation** (Phase 373):
 * - `vendor-api-safe.ts`: TDZ-safe wrapper (Safe suffix) - wraps internal functions
 * - `vendor-manager-static.ts`: Singleton manager (StaticVendorManager) - handles caching
 * - `vendor-types.ts`: Type definitions (SolidAPI, SolidStoreAPI, etc.)
 *
 * **Do NOT import directly** (Phase 309 Rule):
 * ❌ `import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe'`
 * ❌ `import { StaticVendorManager } from '@shared/external/vendors/vendor-manager-static'`
 * ✅ CORRECT: `import { getSolid } from '@shared/external/vendors'` (barrel export)
 *
 * **Architecture** (Phase 373):
 * - Barrel export: Expose only public API (index.ts)
 * - Safe suffix: Internal implementation file mapping (getSolidSafe → getSolid)
 * - Singleton: State management via StaticVendorManager
 * - Memory safety: Automatic URL cleanup (60s timeout via globalTimerManager)
 *
 * **Lifecycle**:
 * 1. Call `initializeVendors()` during app bootstrap
 * 2. Access vendors via `getSolid()`, `getSolidStore()`, etc. (synchronous)
 * 3. Query status via `isVendorInitialized()`, `getVendorInitializationReport()`
 * 4. Cleanup automatically on page unload via `registerVendorCleanupOnUnload()`
 *
 * **Phase History**:
 * - Phase 309: Service Layer pattern introduced (vendor getters)
 * - Phase 370: External layer optimized (barrel exports, documentation)
 * - Phase 373: Vendors layer optimized (English-only, comprehensive JSDoc, @internal marking)
 *
 * **Related Documentation**:
 * - {@link ../README.md} - Parent directory guide
 * - {@link ../../docs/ARCHITECTURE.md} - Vendor Getter principle & Phase 309+ Service Layer
 * - {@link ../../docs/CODING_GUIDELINES.md} - Service layer pattern & Phase 309 rules
 *
 * @version 12.0.0 - Phase 373: Internal implementation explicit and forbidden pattern emphasis
 * @fileoverview Vendor system unified access point (barrel export policy compliance)
 * @see ../../docs/ARCHITECTURE.md - Vendor Getter pattern & Service Layer (Phase 309+)
 */

// ====================================
// 1. Type definitions (public interface)
// ====================================

export type {
  SolidAPI,
  SolidStoreAPI,
  NativeDownloadAPI,
  VNode,
  JSXElement,
  ComponentChildren,
} from './vendor-manager-static';

// ====================================
// 2. Core Vendor API (public - recommended)
// ====================================

/**
 * **Initialization**: Initialize all vendors (single execution guaranteed, TDZ-safe)
 *
 * @example
 * ```typescript
 * import { initializeVendors } from '@shared/external/vendors';
 * await initializeVendors();
 * ```
 */
export { initializeVendorsSafe as initializeVendors } from './vendor-api-safe';

/**
 * **Core Getter**: Synchronous access to Solid.js API
 *
 * @example
 * ```typescript
 * import { getSolid } from '@shared/external/vendors';
 * const { createSignal, createMemo, createEffect } = getSolid();
 * ```
 */
export { getSolidSafe as getSolid } from './vendor-api-safe';

/**
 * **Store Getter**: Synchronous access to Solid.js Store API
 *
 * @example
 * ```typescript
 * import { getSolidStore } from '@shared/external/vendors';
 * const { createStore, produce } = getSolidStore();
 * ```
 */
export { getSolidStoreSafe as getSolidStore } from './vendor-api-safe';

/**
 * **Native Download**: Native fetch access (MV3 compatible)
 *
 * @example
 * ```typescript
 * import { getNativeDownload } from '@shared/external/vendors';
 * const download = getNativeDownload();
 * ```
 */
export { getNativeDownloadSafe as getNativeDownload } from './vendor-api-safe';

// ====================================
// 3. Extended API (validation/status/cleanup - advanced)
// ====================================

/**
 * **Validation**: Validate all vendors
 */
export { validateVendorsSafe as validateVendors } from './vendor-api-safe';

/**
 * **Version Info**: Retrieve all vendor versions
 */
export { getVendorVersionsSafe as getVendorVersions } from './vendor-api-safe';

/**
 * **Initialization Report**: Retrieve vendor initialization status and report
 */
export { getVendorInitializationReportSafe as getVendorInitializationReport } from './vendor-api-safe';

/**
 * **Status Query**: All vendor initialization status
 */
export { getVendorStatusesSafe as getVendorStatuses } from './vendor-api-safe';

/**
 * **Individual Check**: Check if specific vendor is initialized
 */
export { isVendorInitializedSafe as isVendorInitialized } from './vendor-api-safe';

/**
 * **Complete Check**: Check if all vendors are initialized
 */
export { isVendorsInitializedSafe as isVendorsInitialized } from './vendor-api-safe';

/**
 * **Cleanup**: Clean up all vendors and release resources
 */
export { cleanupVendorsSafe as cleanupVendors } from './vendor-api-safe';

/**
 * **Unload Registration**: Auto cleanup on page unload
 */
export { registerVendorCleanupOnUnloadSafe as registerVendorCleanupOnUnload } from './vendor-api-safe';

/**
 * **Singleton Reset**: For testing (initialize internal state)
 *
 * @internal Testing only
 */
export { resetVendorManagerInstance } from './vendor-api-safe';

// ====================================
// 4. Advanced internal (testing/debugging only, @internal)
// ====================================

/**
 * 🔧 **Singleton Manager** (testing/debugging only)
 *
 * **Do not use this directly.**
 * Use the getter functions above (getSolid, getSolidStore, etc.) instead.
 *
 * **Usage**: Access only for testing and debugging purposes
 *
 * @internal Testing/debugging only
 * @see getSolid - Recommended API for general users
 * @see getSolidStore - Store API access (for general users)
 */
export { StaticVendorManager } from './vendor-manager-static';
