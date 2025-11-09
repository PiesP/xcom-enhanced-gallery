/**
 * Lightweight barrel for Solid vendor helpers.
 *
 * Always import from this module instead of the underlying implementation
 * files. Only the exports defined here are considered stable.
 */

export type {
  SolidAPI,
  SolidStoreAPI,
  NativeDownloadAPI,
  VNode,
  JSXElement,
  ComponentChildren,
} from './vendor-manager-static';

export {
  initializeVendorsSafe as initializeVendors,
  getSolidSafe as getSolid,
  getSolidStoreSafe as getSolidStore,
  getNativeDownloadSafe as getNativeDownload,
  validateVendorsSafe as validateVendors,
  getVendorVersionsSafe as getVendorVersions,
  getVendorInitializationReportSafe as getVendorInitializationReport,
  getVendorStatusesSafe as getVendorStatuses,
  isVendorInitializedSafe as isVendorInitialized,
  isVendorsInitializedSafe as isVendorsInitialized,
  cleanupVendorsSafe as cleanupVendors,
  registerVendorCleanupOnUnloadSafe as registerVendorCleanupOnUnload,
  resetVendorManagerInstance,
} from './vendor-api-safe';
