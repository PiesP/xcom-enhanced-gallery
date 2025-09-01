/**
 * @fileoverview Simplified Vendor API (Phase 2.1 GREEN)
 * @description 단순화된 vendor API - 복잡한 관리자 없이 직접 라이브러리 반환
 *
 * TDD Phase: GREEN - 최소 구현으로 복잡성 제거
 */

// 정적 import로 모든 라이브러리를 안전하게 로드 (TDZ 해결)
import * as fflate from 'fflate'; // vendor
import * as preact from 'preact'; // vendor
import * as preactHooks from 'preact/hooks'; // vendor
import * as preactSignals from '@preact/signals'; // vendor
import * as preactCompat from 'preact/compat'; // vendor

// 타입 정의
export interface FflateAPI {
  zip: typeof fflate.zip;
  unzip: typeof fflate.unzip;
  strToU8: typeof fflate.strToU8;
  strFromU8: typeof fflate.strFromU8;
  zipSync: typeof fflate.zipSync;
  unzipSync: typeof fflate.unzipSync;
  deflate: typeof fflate.deflate;
  inflate: typeof fflate.inflate;
}

export interface PreactAPI {
  h: typeof preact.h;
  render: typeof preact.render;
  Component: typeof preact.Component;
  Fragment: typeof preact.Fragment;
  createContext: typeof preact.createContext;
  cloneElement: typeof preact.cloneElement;
  createRef: typeof preact.createRef;
  isValidElement: typeof preact.isValidElement;
  options: typeof preact.options;
  createElement: typeof preact.createElement;
}

export interface PreactHooksAPI {
  useState: typeof preactHooks.useState;
  useEffect: typeof preactHooks.useEffect;
  useRef: typeof preactHooks.useRef;
  useCallback: typeof preactHooks.useCallback;
  useMemo: typeof preactHooks.useMemo;
  useContext: typeof preactHooks.useContext;
  useReducer: typeof preactHooks.useReducer;
  useLayoutEffect: typeof preactHooks.useLayoutEffect;
  useImperativeHandle: typeof preactHooks.useImperativeHandle;
  useDebugValue: typeof preactHooks.useDebugValue;
}

export interface PreactSignalsAPI {
  signal: typeof preactSignals.signal;
  computed: typeof preactSignals.computed;
  effect: typeof preactSignals.effect;
  batch: typeof preactSignals.batch;
  Signal: typeof preactSignals.Signal;
  // ReadonlySignal은 type으로만 export되므로 제외
}

export interface PreactCompatAPI {
  forwardRef: typeof preactCompat.forwardRef;
  memo: typeof preactCompat.memo;
  lazy: typeof preactCompat.lazy;
  Suspense: typeof preactCompat.Suspense;
  createPortal: typeof preactCompat.createPortal;
  unstable_batchedUpdates: typeof preactCompat.unstable_batchedUpdates;
}

export interface NativeDownloadAPI {
  createObjectURL: (object: Blob | MediaSource) => string;
  revokeObjectURL: (url: string) => void;
  createElement: (tagName: string) => HTMLElement;
  createAnchor: () => HTMLAnchorElement;
}

// ================================
// 간소화된 Vendor Getters (GREEN)
// ================================

/**
 * Fflate 라이브러리 안전 접근
 */
export function getFflateSafe(): FflateAPI {
  return {
    zip: fflate.zip,
    unzip: fflate.unzip,
    strToU8: fflate.strToU8,
    strFromU8: fflate.strFromU8,
    zipSync: fflate.zipSync,
    unzipSync: fflate.unzipSync,
    deflate: fflate.deflate,
    inflate: fflate.inflate,
  };
}

/**
 * Preact 라이브러리 안전 접근
 */
export function getPreactSafe(): PreactAPI {
  return {
    h: preact.h,
    render: preact.render,
    Component: preact.Component,
    Fragment: preact.Fragment,
    createContext: preact.createContext,
    cloneElement: preact.cloneElement,
    createRef: preact.createRef,
    isValidElement: preact.isValidElement,
    options: preact.options,
    createElement: preact.createElement,
  };
}

/**
 * Preact Hooks 라이브러리 안전 접근
 */
export function getPreactHooksSafe(): PreactHooksAPI {
  return {
    useState: preactHooks.useState,
    useEffect: preactHooks.useEffect,
    useRef: preactHooks.useRef,
    useCallback: preactHooks.useCallback,
    useMemo: preactHooks.useMemo,
    useContext: preactHooks.useContext,
    useReducer: preactHooks.useReducer,
    useLayoutEffect: preactHooks.useLayoutEffect,
    useImperativeHandle: preactHooks.useImperativeHandle,
    useDebugValue: preactHooks.useDebugValue,
  };
}

/**
 * Preact Signals 라이브러리 안전 접근
 */
export function getPreactSignalsSafe(): PreactSignalsAPI {
  return {
    signal: preactSignals.signal,
    computed: preactSignals.computed,
    effect: preactSignals.effect,
    batch: preactSignals.batch,
    Signal: preactSignals.Signal,
    // ReadonlySignal은 type으로만 export되므로 제외
  };
}

/**
 * Preact Compat 라이브러리 안전 접근
 */
export function getPreactCompatSafe(): PreactCompatAPI {
  return {
    forwardRef: preactCompat.forwardRef,
    memo: preactCompat.memo,
    lazy: preactCompat.lazy,
    Suspense: preactCompat.Suspense,
    createPortal: preactCompat.createPortal,
    unstable_batchedUpdates: preactCompat.unstable_batchedUpdates,
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
  };
}

// ================================
// 레거시 호환성 (기존 코드용)
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
 * 레거시 호환성을 위한 vendor 접근 (간소화됨)
 */
export const VendorAPI = {
  getFflateSafe,
  getPreactSafe,
  getPreactHooksSafe,
  getPreactSignalsSafe,
  getPreactCompatSafe,
  getNativeDownloadAPISafe,
};

export default VendorAPI;
