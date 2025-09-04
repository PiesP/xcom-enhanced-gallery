/**
 * @fileoverview Vendor 시스템 통합 접근점
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 9.0.0 - TDD GREEN Phase 완료, REFACTOR Phase 적용
 *
 * BREAKING CHANGE: 기본 exports는 이제 TDZ-safe 정적 import API를 사용합니다
 * 기존 동적 import API는 Legacy 접미사로 접근 가능합니다.
 */

// 💡 새로운 TDZ-safe 정적 import 기반 API (권장)
export {
  initializeVendorsSafe as initializeVendors,
  getFflateSafe as getFflate,
  getPreactSafe as getPreact,
  getPreactHooksSafe as getPreactHooks,
  getPreactSignalsSafe as getPreactSignals,
  getPreactCompatSafe as getPreactCompat,
  getNativeDownloadSafe as getNativeDownload,
  validateVendorsSafe as validateVendors,
  getVendorVersionsSafe as getVendorVersions,
  cleanupVendorsSafe as cleanupVendors,
  isVendorsInitializedSafe as isVendorsInitialized,
  getVendorInitializationReportSafe as getVendorInitializationReport,
  getVendorStatusesSafe as getVendorStatuses,
  isVendorInitializedSafe as isVendorInitialized,
  resetVendorManagerInstance,
} from './vendor-api-safe';

// 타입 정의 exports (정적 import 기반으로 변경)
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
  VNode,
  ComponentChildren,
} from './vendor-manager-static';

// Preact 함수들의 직접 export 추가 (UI 컴포넌트에서 사용)
export { h, render, Component, Fragment } from './vendor-api-safe';

// Vendor-specific types (기존 유지)
export type {
  PreactComponent,
  MemoCompareFunction,
  ForwardRefComponent,
  PreactCompat,
} from './vendor-types';

// 🔄 기존 동적 import API 호환성 (deprecated, 점진적 마이그레이션용)
export {
  initializeVendors as initializeVendorsLegacy,
  getFflate as getFflateLegacy,
  getPreact as getPreactLegacy,
  getPreactHooks as getPreactHooksLegacy,
  getPreactSignals as getPreactSignalsLegacy,
  getPreactCompat as getPreactCompatLegacy,
  getNativeDownload as getNativeDownloadLegacy,
  validateVendors as validateVendorsLegacy,
  getVendorVersions as getVendorVersionsLegacy,
  cleanupVendors as cleanupVendorsLegacy,
  isVendorsInitialized as isVendorsInitializedLegacy,
  getVendorInitializationReport as getVendorInitializationReportLegacy,
  getVendorStatuses as getVendorStatusesLegacy,
  isVendorInitialized as isVendorInitializedLegacy,
} from './vendor-api';

// 🔧 고급 사용자용 직접 접근
export { StaticVendorManager } from './vendor-manager-static';

export { VendorManager } from './vendor-manager';
