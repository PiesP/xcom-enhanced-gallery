/**
 * External Vendor Library Access - Barrel Export
 *
 * @version 8.0.0 - Clean Architecture 완전 적용
 * @description 외부 라이브러리 통합 접근점 - 배럴 export
 */

// 타입 정의 exports
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  MotionAPI,
  NativeDownloadAPI,
  VNode,
  ComponentChildren,
} from './vendor-manager';

// 공개 API exports
export {
  getFflate,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  getPreactCompat,
  getMotion,
  getNativeDownload,
  initializeVendors,
  cleanupVendors,
  getVendorVersions,
  areVendorsInitialized,
  getVendorInitializationReport,
  getVendorStatuses,
  isVendorInitialized,
} from './vendor-api';
