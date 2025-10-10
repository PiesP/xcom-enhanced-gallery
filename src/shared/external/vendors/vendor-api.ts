/**
 * Core External Vendor Public API (Legacy facade)
 *
 * 이 파일은 더 이상 동적 VendorManager를 사용하지 않습니다.
 * TDZ-safe 정적 API(`vendor-api-safe.ts`)를 얇은 어댑터로 재노출하여
 * 우발적 사용 시에도 안전 경로로 유도합니다.
 *
 * 주의: 런타임/앱 코드는 반드시 `@shared/external/vendors` 배럴을 사용하세요.
 */

// 타입은 정적 매니저의 정의를 사용 (Solid.js 기준)
export type {
  SolidAPI,
  SolidStoreAPI,
  NativeDownloadAPI,
  VNode,
  JSXElement,
  ComponentChildren,
} from './vendor-manager-static';

// TDZ-safe API로 위임 (Solid.js)
export {
  initializeVendorsSafe as initializeVendors,
  getSolidSafe as getSolid,
  getSolidStoreSafe as getSolidStore,
  getNativeDownloadSafe as getNativeDownload,
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
