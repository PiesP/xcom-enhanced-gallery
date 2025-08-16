import { getPreactCompat } from './vendors/vendor-api';
/**
 * @fileoverview Vendors Re-export Module
 * @description vendor-api의 함수들을 vendors 경로로 re-export
 */

export {
  initializeVendors,
  getFflate,
  getPreact,
  getPreactHooks,
  getPreactSignals,
  getPreactCompat,
  getNativeDownload,
  isVendorsInitialized,
} from './vendors/vendor-api';

// 타입들도 re-export
// vendor manager 직접 참조 제거: 타입은 단일 types 모듈에서 재-export
export type {
  VNode,
  Ref,
  ComponentChildren,
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
} from './vendors/types';

// memo 함수를 별도로 export (optimization 테스트용)
export async function memo<P = Record<string, unknown>>(
  Component: (props: P) => import('./vendors/types').VNode | null,
  compare?: (prevProps: P, nextProps: P) => boolean
): Promise<(props: P) => import('./vendors/types').VNode | null> {
  const preactCompat = await getPreactCompat();
  return preactCompat.memo(Component, compare) as typeof Component;
}
