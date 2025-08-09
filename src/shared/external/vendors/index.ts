/**
 * Core External Vendor Library Access - Barrel Export
 *
 * @version 9.0.0 - TDZ 문제 해결 완료
 * @description 외부 라이브러리 통합 접근점 - 단일 초기화 패턴 적용
 */

// 타입 정의 exports
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
  VNode,
  Ref,
  ComponentChildren,
} from './vendor-service';

// Vendor-specific types
export type {
  PreactComponent,
  MemoCompareFunction,
  ForwardRefComponent,
  PreactCompat,
} from './vendor-types';

// 공개 API 함수 exports
export {
  initializeVendors,
  isVendorsInitialized,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  getPreactCompat,
  getFflate,
  getNativeDownload,
  resetVendorCache,
} from './vendor-api';
