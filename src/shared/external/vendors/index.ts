/**
 * @fileoverview Vendor 시스템 통합 접근점 (Solid.js)
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 10.0.0 - Solid.js 마이그레이션 완료
 *
 * BREAKING CHANGE: Preact → Solid.js 마이그레이션
 */

// 💡 TDZ-safe 정적 import 기반 API (Solid.js)
export {
  initializeVendorsSafe as initializeVendors,
  getSolidSafe as getSolid,
  getSolidStoreSafe as getSolidStore,
  getNativeDownloadSafe as getNativeDownload,
  validateVendorsSafe as validateVendors,
  getVendorVersionsSafe as getVendorVersions,
  cleanupVendorsSafe as cleanupVendors,
  registerVendorCleanupOnUnloadSafe,
  isVendorsInitializedSafe as isVendorsInitialized,
  getVendorInitializationReportSafe as getVendorInitializationReport,
  getVendorStatusesSafe as getVendorStatuses,
  isVendorInitializedSafe as isVendorInitialized,
  resetVendorManagerInstance,
} from './vendor-api-safe';

// 타입 정의 exports (Solid.js 기반으로 변경)
export type {
  SolidAPI,
  SolidStoreAPI,
  NativeDownloadAPI,
  VNode,
  JSXElement,
  ComponentChildren,
} from './vendor-manager-static';

// Solid.js 함수들의 직접 export 추가 (UI 컴포넌트에서 사용)
export { render, createSignal, createEffect, createMemo, Show, For } from './vendor-api-safe';

// 🔧 고급 사용자용 직접 접근
export { StaticVendorManager } from './vendor-manager-static';
