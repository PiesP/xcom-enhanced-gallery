/**
 * Core External API - 외부 라이브러리 및 유틸리티 통합
 *
 * @version 9.0.0 - Phase 352: Named export 최적화
 * @description Core 레이어의 외부 라이브러리 관리 및 ZIP 유틸리티 제공
 * @see docs/ARCHITECTURE_GUIDELINES.md
 */

// External vendor library access
export {
  // Types
  type SolidAPI,
  type SolidStoreAPI,
  type NativeDownloadAPI,
  type VNode,
  type JSXElement,
  type ComponentChildren,
  // Core API
  initializeVendors,
  getSolid,
  getSolidStore,
  getNativeDownload,
  // Validation & Status
  validateVendors,
  getVendorVersions,
  getVendorInitializationReport,
  getVendorStatuses,
  isVendorInitialized,
  isVendorsInitialized,
  // Cleanup
  cleanupVendors,
  registerVendorCleanupOnUnload,
  resetVendorManagerInstance,
} from './vendors';

// ZIP creation utilities
export { createZipBytesFromFileMap, type MediaItemForZip } from './zip';
