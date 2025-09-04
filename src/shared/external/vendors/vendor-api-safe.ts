/**
 * @fileoverview Simplified Vendor API (Phase 2.1 GREEN)
 * @description 단순화된 vendor API - 복잡한 관리자 없이 직접 라이브러리 반환
 *
 * TDD Phase: GREEN - 최소 구현으로 복잡성 제거
 */

// 정적 import로 모든 라이브러리를 안전하게 로드 (TDZ 해결)
import { zip, unzip, strToU8, strFromU8, zipSync, unzipSync, deflate, inflate } from 'fflate'; // vendor
import {
  h,
  render,
  Component,
  Fragment,
  createContext,
  cloneElement,
  createRef,
  isValidElement,
  options,
  createElement,
} from 'preact'; // vendor
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useContext,
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  useDebugValue,
} from 'preact/hooks'; // vendor
import {
  signal as rawSignal,
  computed,
  effect as rawEffect,
  batch as rawBatch,
  Signal,
} from '@preact/signals'; // vendor
import {
  forwardRef,
  memo,
  lazy,
  Suspense,
  createPortal,
  unstable_batchedUpdates,
} from 'preact/compat'; // vendor

// ================================
// Deprecated API Usage Tracking
// ================================

/**
 * 글로벌 deprecated API 사용 추적기
 */
interface DeprecatedUsageTracker {
  readonly usageCounts: Map<string, number>;
  readonly firstUsages: Map<string, string>; // 스택 트레이스
}

declare global {
  interface Window {
    __XEG_DEPRECATED_TRACKER__?: DeprecatedUsageTracker;
  }
}

/**
 * Deprecated API 사용 로깅 및 추적 (logger 기반)
 */
function logDeprecatedUsage(apiName: string, alternative: string): void {
  // 전역 추적기 초기화
  if (!globalThis.window) return; // 서버 환경 안전 처리

  const tracker = (globalThis.window.__XEG_DEPRECATED_TRACKER__ ??= {
    usageCounts: new Map(),
    firstUsages: new Map(),
  });

  // 사용 횟수 증가
  const currentCount = tracker.usageCounts.get(apiName) || 0;
  tracker.usageCounts.set(apiName, currentCount + 1);

  // 첫 사용 시만 경고 (circular import 방지를 위해 dynamic import)
  if (currentCount === 0) {
    const stack = new Error().stack || 'No stack available';
    tracker.firstUsages.set(apiName, stack);

    // 콘솔에 직접 경고 (logger 순환 참조 방지)
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[XEG] DEPRECATED API: ${apiName} - Use: ${alternative} - Stack:`, stack);
    }
  }
}

/**
 * Deprecated API 사용 보고서 생성
 */
export function getDeprecatedUsageReport(): {
  totalCalls: number;
  uniqueApis: number;
  details: Array<{ api: string; count: number; firstUsage: string }>;
} {
  const tracker = globalThis.window?.__XEG_DEPRECATED_TRACKER__;
  if (!tracker) {
    return { totalCalls: 0, uniqueApis: 0, details: [] };
  }

  const details = Array.from(tracker.usageCounts.entries()).map(([api, count]) => ({
    api,
    count,
    firstUsage: tracker.firstUsages.get(api) || 'Unknown',
  }));

  return {
    totalCalls: Array.from(tracker.usageCounts.values()).reduce((sum, count) => sum + count, 0),
    uniqueApis: tracker.usageCounts.size,
    details,
  };
}

// 타입 정의
export interface FflateAPI {
  zip: typeof zip;
  unzip: typeof unzip;
  strToU8: typeof strToU8;
  strFromU8: typeof strFromU8;
  zipSync: typeof zipSync;
  unzipSync: typeof unzipSync;
  deflate: typeof deflate;
  inflate: typeof inflate;
}

export interface PreactAPI {
  h: typeof h;
  render: typeof render;
  Component: typeof Component;
  Fragment: typeof Fragment;
  createContext: typeof createContext;
  cloneElement: typeof cloneElement;
  createRef: typeof createRef;
  isValidElement: typeof isValidElement;
  options: typeof options;
  createElement: typeof createElement;
}

export interface PreactHooksAPI {
  useState: typeof useState;
  useEffect: typeof useEffect;
  useRef: typeof useRef;
  useCallback: typeof useCallback;
  useMemo: typeof useMemo;
  useContext: typeof useContext;
  useReducer: typeof useReducer;
  useLayoutEffect: typeof useLayoutEffect;
  useImperativeHandle: typeof useImperativeHandle;
  useDebugValue: typeof useDebugValue;
}

export interface PreactSignalsAPI {
  signal: typeof rawSignal;
  computed: typeof computed;
  effect: typeof rawEffect;
  batch: typeof rawBatch;
  Signal: typeof Signal;
}

export interface PreactCompatAPI {
  forwardRef: typeof forwardRef;
  memo: typeof memo;
  lazy: typeof lazy;
  Suspense: typeof Suspense;
  createPortal: typeof createPortal;
  unstable_batchedUpdates: typeof unstable_batchedUpdates;
}

export interface NativeDownloadAPI {
  createObjectURL: (object: Blob | MediaSource) => string;
  revokeObjectURL: (url: string) => void;
  createElement: (tagName: string) => HTMLElement;
  createAnchor: () => HTMLAnchorElement;
  downloadBlob: (blob: Blob, filename: string) => void;
}

// ================================
// 간소화된 Vendor Getters (GREEN)
// ================================

/**
 * Fflate 라이브러리 안전 접근
 */
export function getFflateSafe(): FflateAPI {
  return {
    zip,
    unzip,
    strToU8,
    strFromU8,
    zipSync,
    unzipSync,
    deflate,
    inflate,
  };
}

/**
 * Preact 라이브러리 안전 접근
 */
export function getPreactSafe(): PreactAPI {
  return {
    h,
    render,
    Component,
    Fragment,
    createContext,
    cloneElement,
    createRef,
    isValidElement,
    options,
    createElement,
  };
}

/**
 * Preact Hooks 라이브러리 안전 접근
 */
export function getPreactHooksSafe(): PreactHooksAPI {
  return {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    useContext,
    useReducer,
    useLayoutEffect,
    useImperativeHandle,
    useDebugValue,
  };
}

/**
 * Preact Signals 라이브러리 안전 접근
 */
export function getPreactSignalsSafe(): PreactSignalsAPI {
  // 테스트 카운터 활성 시 래핑 (성능 영향 최소화를 위해 분기 가벼움)
  const g = globalThis as Record<string, unknown> & {
    __XEG_VENDOR_COUNTERS__?: {
      incrementBatch?: () => void;
      incrementSignal?: () => void;
      incrementEffect?: () => void;
    };
  };
  const counters = g.__XEG_VENDOR_COUNTERS__;

  const wrappedBatch: typeof rawBatch = counters
    ? <T>(fn: () => T): T => {
        counters.incrementBatch?.();
        return rawBatch(fn);
      }
    : rawBatch;

  const wrappedSignal: typeof rawSignal = counters
    ? (function wrapped(value?: unknown) {
        // rawSignal 오버로드 대응: 인자 없을 수도 있음
        // @ts-ignore - 그대로 전달 (오버로드 유지)
        const s = rawSignal(value);
        return new Proxy(s, {
          set(target, prop, val) {
            if (prop === 'value') counters.incrementSignal?.();
            // @ts-ignore forward
            target[prop] = val;
            return true;
          },
        });
      } as typeof rawSignal)
    : rawSignal;

  const wrappedEffect: typeof rawEffect = counters
    ? <T>(fn: () => T) =>
        rawEffect(() => {
          counters.incrementEffect?.();
          fn();
        })
    : rawEffect;
  return {
    signal: wrappedSignal,
    computed,
    effect: wrappedEffect,
    batch: wrappedBatch,
    Signal,
  };
}

/**
 * Preact Compat 라이브러리 안전 접근
 */
export function getPreactCompatSafe(): PreactCompatAPI {
  return {
    forwardRef,
    memo,
    lazy,
    Suspense,
    createPortal,
    unstable_batchedUpdates,
  };
}

/**
 * 네이티브 다운로드 API 안전 접근
 */
export function getNativeDownloadAPISafe(): NativeDownloadAPI {
  return {
    createObjectURL: URL.createObjectURL.bind(URL),
    revokeObjectURL: URL.revokeObjectURL.bind(URL),
    createElement: (tagName: string) => document.createElement(tagName),
    createAnchor: () => document.createElement('a'),
    downloadBlob: (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    },
  };
}

/**
 * @deprecated 호환성을 위한 별칭
 */
export const getNativeDownloadSafe = getNativeDownloadAPISafe;

// ================================
// 레거시 호환성 함수들
// ================================

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 초기화 함수 (실제로는 no-op)
 */
export async function initializeVendorsSafe(): Promise<void> {
  // GREEN 구현: 복잡한 초기화 없이 정적 import만으로 충분
  logDeprecatedUsage('initializeVendorsSafe', 'Use direct getter functions instead');
  return Promise.resolve();
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 검증 함수
 */
export function validateVendorsSafe(): {
  success: boolean;
  loadedLibraries: string[];
  errors: string[];
} {
  logDeprecatedUsage('validateVendorsSafe', 'Use direct getter functions instead');
  return {
    success: true,
    loadedLibraries: ['fflate', 'Preact', 'PreactHooks', 'PreactSignals', 'PreactCompat'],
    errors: [],
  };
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 버전 정보
 */
export function getVendorVersionsSafe(): Record<string, string> {
  logDeprecatedUsage('getVendorVersionsSafe', 'Use direct getter functions instead');
  return {
    fflate: 'static-import',
    preact: 'static-import',
    preactHooks: 'static-import',
    preactSignals: 'static-import',
    preactCompat: 'static-import',
  };
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 정리 함수
 */
export function cleanupVendorsSafe(): Promise<void> {
  logDeprecatedUsage('cleanupVendorsSafe', 'Use direct getter functions instead');
  // 정적 import 방식에서는 정리가 필요하지 않음
  return Promise.resolve();
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 초기화 상태 확인
 */
export function isVendorsInitializedSafe(): boolean {
  logDeprecatedUsage('isVendorsInitializedSafe', 'Use direct getter functions instead');
  return true; // 정적 import로 항상 초기화됨
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 초기화 리포트
 */
export function getVendorInitializationReportSafe(): Record<string, Record<string, unknown>> {
  logDeprecatedUsage('getVendorInitializationReportSafe', 'Use direct getter functions instead');
  return {
    fflate: { initialized: true, method: 'static-import' },
    preact: { initialized: true, method: 'static-import' },
    preactHooks: { initialized: true, method: 'static-import' },
    preactSignals: { initialized: true, method: 'static-import' },
    preactCompat: { initialized: true, method: 'static-import' },
  };
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 상태 확인
 */
export function getVendorStatusesSafe(): Record<string, boolean> {
  logDeprecatedUsage('getVendorStatusesSafe', 'Use direct getter functions instead');
  return {
    fflate: true,
    preact: true,
    preactHooks: true,
    preactSignals: true,
    preactCompat: true,
  };
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 개별 vendor 초기화 확인
 */
export function isVendorInitializedSafe(_vendorName: string): boolean {
  logDeprecatedUsage('isVendorInitializedSafe', 'Use direct getter functions instead');
  return true; // 정적 import로 모든 vendor가 초기화됨
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 매니저 인스턴스 리셋
 */
export function resetVendorManagerInstance(): void {
  logDeprecatedUsage('resetVendorManagerInstance', 'Use direct getter functions instead');
  // GREEN 구현: 정적 import에서는 리셋이 불필요
}
