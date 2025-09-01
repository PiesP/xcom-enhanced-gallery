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
import { signal, computed, effect, batch, Signal } from '@preact/signals'; // vendor
import {
  forwardRef,
  memo,
  lazy,
  Suspense,
  createPortal,
  unstable_batchedUpdates,
} from 'preact/compat'; // vendor

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
  signal: typeof signal;
  computed: typeof computed;
  effect: typeof effect;
  batch: typeof batch;
  Signal: typeof Signal;
  // ReadonlySignal은 type으로만 export되므로 제외
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
  return {
    signal,
    computed,
    effect,
    batch,
    Signal,
    // ReadonlySignal은 type으로만 export되므로 제외
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
  // 정적 import 방식에서는 정리가 필요하지 않음
  return Promise.resolve();
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 초기화 상태 확인
 */
export function isVendorsInitializedSafe(): boolean {
  return true; // 정적 import로 항상 초기화됨
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 초기화 리포트
 */
export function getVendorInitializationReportSafe(): Record<string, Record<string, unknown>> {
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
  return true; // 정적 import로 모든 vendor가 초기화됨
}

/**
 * @deprecated Use direct getter functions instead
 * 레거시 호환성을 위한 매니저 인스턴스 리셋
 */
export function resetVendorManagerInstance(): void {
  // GREEN 구현: 정적 import에서는 리셋이 불필요
}
