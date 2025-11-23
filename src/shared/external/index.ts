/**
 * External API Layer - Unified integration point for external libraries and Userscript
 *
 * **Purpose**: Provide **unified barrel export** for Solid.js, Tampermonkey API, ZIP utilities
 * **Architecture**: Shared Layer foundational infrastructure (Phase 309+ Service Layer)
 * **Principle**: Use barrel exports only, forbid direct imports of internal implementation files
 * **Policy**: Items marked with @internal are for testing/debugging only
 *
 * **Structure Overview**:
 * ```
 * src/shared/external/
 * ├── vendors/        → Solid.js getter (getSolid, getSolidStore)
 * ├── userscript/     → Tampermonkey getter (getUserscript) + environment detection
 * ├── zip/            → ZIP file creation utility (createZipBytesFromFileMap)
 * └── test/           → Test infrastructure (direct imports only)
 * ```
 *
 * **Usage Rules**:
 * ✅ Use barrel export paths: `import { getSolid } from '@shared/external'`
 * ✅ Or sub-barrels: `import { getSolid } from '@shared/external/vendors'`
 * ❌ Never direct internal import: `import { getSolidSafe } from '@shared/external/vendors/vendor-api-safe'` (forbidden)
 *
 * **Main Categories**:
 * 1. **Vendor API**: Solid.js and external libraries
 * 2. **Userscript API**: Tampermonkey + environment detection (Service Layer priority)
 * 3. **ZIP Utilities**: File compression
 * 4. **Test Infrastructure**: Test helpers (@internal)
 *
 * **Related Documentation**:
 * - {@link ./README.md} - Detailed usage guide and examples
 * - {@link ../../docs/ARCHITECTURE.md} - Phase 309+ Service Layer & Vendor Getter
 * - {@link ../../docs/CODING_GUIDELINES.md} - Forbidden patterns and best practices
 *
 * @version 12.0.0 - Phase 370: Internal implementation clarification & barrel export policy enforcement
 * @see ./README.md - Detailed guide
 * @see ../../docs/ARCHITECTURE.md - Architecture & Service Layer
 */

// ============================================================================
// 1. VENDOR API (Solid.js, external libraries Getter)
// ============================================================================
// 📌 Principle: Use barrel exports, forbid direct imports of internal files
// 📌 Pattern: Getter functions (getSolid, getSolidStore, etc.)
// 📌 Note: vendor-api-safe.ts → Safe suffix removed after export
// ============================================================================

export {
    cleanupVendors,
    // Core Getter (public - recommended)
    getSolid,
    getSolidStore, getVendorInitializationReport,
    getVendorStatuses, getVendorVersions,
    // Initialization (public)
    initializeVendors, isVendorInitialized,
    isVendorsInitialized, registerVendorCleanupOnUnload,
    // Internal only (@internal - testing/debugging only)
    resetVendorManagerInstance,
    // Extended API (public - advanced)
    validateVendors, type ComponentChildren, type JSXElement,
    // Type definitions (public)
    type SolidAPI,
    type SolidStoreAPI,
    type VNode
} from "./vendors";

// ============================================================================
// 2. USERSCRIPT API (Tampermonkey + environment detection)
// ============================================================================
// 📌 Priority: Service Layer > Getter > Direct GM call (forbidden)
// 📌 Service Layer examples: PersistentStorage, NotificationService, DownloadService
// 📌 Getter: getUserscript() (advanced/testing only), detectEnvironment() (environment detection)
// ============================================================================

export {
    // 환경 감지 (공개)
    detectEnvironment,
    // Userscript Getter (내부 전용 - 고급/테스트만)
    getUserscript, isGMAPIAvailable, type EnvironmentInfo, type UserscriptAPI,
    type UserscriptManager
} from "./userscript";

// ============================================================================
// 3. ZIP UTILITIES (file compression)
// ============================================================================
// 📌 Policy: STORE mode (for already compressed media, no additional compression)
// 📌 Integration: Used by BulkDownloadService during batch downloads
// ============================================================================

export { StreamingZipWriter } from "./zip";

// ============================================================================
// 4. TEST INFRASTRUCTURE (test helpers & configuration, @internal)
// ============================================================================
// 📌 Purpose: Test environment configuration and Mock/Real service selection
// 📌 Policy: No barrel export – import from './test/<module>' when writing tests
// ============================================================================
