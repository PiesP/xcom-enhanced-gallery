/**
 * @fileoverview Vendor 시스템 통합 접근점
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 9.0.0 - TDD GREEN Phase 완료, REFACTOR Phase 적용
 *
 * BREAKING CHANGE: 기본 exports는 이제 TDZ-safe 정적 import API를 사용합니다
 * 기존 동적 import API는 Legacy 접미사로 접근 가능합니다.
 */

// 💡 Solid 기반 TDZ-safe API (권장)
export {
  initializeVendorsSafe as initializeVendors,
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

// 타입 정의 exports (Solid 중심)
export type {
  NativeDownloadAPI,
  SolidCoreAPI,
  SolidStoreAPI,
  SolidWebAPI,
} from './vendor-manager-static';

// 🔧 고급 사용자용 직접 접근
export { StaticVendorManager } from './vendor-manager-static';
