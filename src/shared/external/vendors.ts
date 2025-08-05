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
export type {
  VNode,
  ComponentChildren,
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
} from './vendors/vendor-manager';

// memo 함수를 별도로 export (optimization 테스트용)
export async function memo<P = Record<string, unknown>>(
  Component: (props: P) => import('./vendors/vendor-manager').VNode | null,
  compare?: (prevProps: P, nextProps: P) => boolean
) {
  const { getPreactCompat } = await import('./vendors/vendor-api');
  const preactCompat = await getPreactCompat();
  return preactCompat.memo(Component, compare);
}
