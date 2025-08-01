/**
 * Core External Vendor Library Access - Barrel Export
 *
 * @version 8.0.0 - Clean Architecture 완전 적용
 * @description 외부 라이브러리 통합 접근점 - Core 레이어로 이동 완료
 */

// 타입 정의 exports
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  MotionAPI,
  MotionOneAPI,
  NativeDownloadAPI,
  TanStackQueryAPI,
  VNode,
  ComponentChildren,
} from './vendor-manager';

// Vendor-specific types
export type {
  PreactComponent,
  MemoCompareFunction,
  ForwardRefComponent,
  PreactCompat,
} from './vendor-types';

// 공개 API exports
export {
  getFflate,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  getPreactCompat,
  getMotion,
  getMotionOne,
  getNativeDownload,
  getTanStackQuery,
  initializeVendors,
  cleanupVendors,
  getVendorVersions,
  isVendorsInitialized,
  getVendorInitializationReport,
  getVendorStatuses,
  isVendorInitialized,
} from './vendor-api';
