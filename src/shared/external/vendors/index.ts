/**
 * @fileoverview Vendor 시스템 통합 접근점 (Solid.js)
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 10.1.0 - Phase 138.2: Export 명시화 및 'as' 별칭 정리
 *
 * 모든 vendor API는 TDZ-safe 정적 import 기반입니다.
 * "Safe" 명명은 내부 구현 세부사항이므로, 공개 API는 명확한 이름으로 노출합니다.
 */

// ====================================
// 타입 정의 exports
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
// 핵심 Vendor API (명시적 export)
// ====================================

// 초기화 함수
export { initializeVendorsSafe as initializeVendors } from './vendor-api-safe';

// Solid.js 코어 API 접근자
export { getSolidSafe as getSolid } from './vendor-api-safe';
export { getSolidStoreSafe as getSolidStore } from './vendor-api-safe';

// Solid.js JSX 컴포넌트 (직접 사용)
export {
  render,
  createSignal,
  createEffect,
  createMemo,
  Show,
  For,
  batch,
} from './vendor-api-safe';

// ====================================
// 확장 Vendor API
// ====================================

export { getNativeDownloadSafe as getNativeDownload } from './vendor-api-safe';
export { validateVendorsSafe as validateVendors } from './vendor-api-safe';
export { getVendorVersionsSafe as getVendorVersions } from './vendor-api-safe';
export { cleanupVendorsSafe as cleanupVendors } from './vendor-api-safe';
export { registerVendorCleanupOnUnloadSafe } from './vendor-api-safe';
export { isVendorsInitializedSafe as isVendorsInitialized } from './vendor-api-safe';
export { getVendorInitializationReportSafe as getVendorInitializationReport } from './vendor-api-safe';
export { getVendorStatusesSafe as getVendorStatuses } from './vendor-api-safe';
export { isVendorInitializedSafe as isVendorInitialized } from './vendor-api-safe';
export { resetVendorManagerInstance } from './vendor-api-safe';

// ====================================
// 고급 사용자용 직접 접근
// ====================================

export { StaticVendorManager } from './vendor-manager-static';
