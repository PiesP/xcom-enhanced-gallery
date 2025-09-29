/**
 * @fileoverview Legacy vendor-api entrypoint now delegating to Solid-based safe APIs.
 */

export {
  initializeVendorsSafe as initializeVendors,
  getFflateSafe as getFflate,
  getNativeDownloadSafe as getNativeDownload,
  getSolidCoreSafe as getSolidCore,
  getSolidStoreSafe as getSolidStore,
  getSolidWebSafe as getSolidWeb,
  validateVendorsSafe as validateVendors,
  getVendorVersionsSafe as getVendorVersions,
  cleanupVendorsSafe as cleanupVendors,
  registerVendorCleanupOnUnloadSafe as registerVendorCleanupOnUnload,
  isVendorsInitializedSafe as isVendorsInitialized,
  getVendorInitializationReportSafe as getVendorInitializationReport,
  getVendorStatusesSafe as getVendorStatuses,
  isVendorInitializedSafe as isVendorInitialized,
  resetVendorManagerInstance,
} from './vendor-api-safe';
