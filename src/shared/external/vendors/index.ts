/**
 * @fileoverview Vendor 시스템 통합 접근점 (Solid.js)
 * @description TDZ 안전한 정적 import 기반 vendor API
 * @version 11.0.0 - Phase 200: 레거시 파일 제거 및 간결화
 *
 * 모든 vendor API는 TDZ-safe 정적 import 기반입니다.
 * 공개 API는 명확한 이름으로 노출되며, 직접 Solid.js 컴포넌트는
 * 필요 시 getSolid() getter를 통해 접근하세요.
 */

// ====================================
// 타입 정의
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
// 핵심 Vendor API
// ====================================

// 초기화
export { initializeVendorsSafe as initializeVendors } from './vendor-api-safe';

// Solid.js 접근자 (getter 패턴 권장)
export { getSolidSafe as getSolid } from './vendor-api-safe';
export { getSolidStoreSafe as getSolidStore } from './vendor-api-safe';

// 확장 API (검증/상태/정리)
export { getNativeDownloadSafe as getNativeDownload } from './vendor-api-safe';
export { validateVendorsSafe as validateVendors } from './vendor-api-safe';
export { getVendorVersionsSafe as getVendorVersions } from './vendor-api-safe';
export { cleanupVendorsSafe as cleanupVendors } from './vendor-api-safe';
export { registerVendorCleanupOnUnloadSafe as registerVendorCleanupOnUnload } from './vendor-api-safe';
export { isVendorsInitializedSafe as isVendorsInitialized } from './vendor-api-safe';
export { getVendorInitializationReportSafe as getVendorInitializationReport } from './vendor-api-safe';
export { getVendorStatusesSafe as getVendorStatuses } from './vendor-api-safe';
export { isVendorInitializedSafe as isVendorInitialized } from './vendor-api-safe';
export { resetVendorManagerInstance } from './vendor-api-safe';

// ====================================
// 고급 사용자용 (테스트/디버깅)
// ====================================

export { StaticVendorManager } from './vendor-manager-static';
