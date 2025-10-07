/**
 * @fileoverview Vendor 시스템 통합 접근점
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 10.0.0 - Phase 6: Solid.js only - Preact 제거 완료
 *
 * BREAKING CHANGE: Preact 제거, Solid.js만 지원
 */

// Phase 6: Solid.js only - 정적 import 기반 API
export {
  initializeVendorsSafe as initializeVendors,
  getSolidSafe as getSolid,
  getSolidWebSafe as getSolidWeb,
  getNativeDownloadSafe as getNativeDownload,
  validateVendorsSafe as validateVendors,
  getVendorVersionsSafe as getVendorVersions,
  cleanupVendorsSafe as cleanupVendors,
  registerVendorCleanupOnUnloadSafe,
  isVendorsInitializedSafe as isVendorsInitialized,
  getVendorInitializationReportSafe as getVendorInitializationReport,
  resetVendorManagerInstance,
} from './vendor-api-safe';

// 타입 정의 exports (Solid.js only)
export type { SolidAPI, SolidWebAPI, NativeDownloadAPI } from './vendor-manager-static';

// 🔧 고급 사용자용 직접 접근
export { StaticVendorManager } from './vendor-manager-static';
