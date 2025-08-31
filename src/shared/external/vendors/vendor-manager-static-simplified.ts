/**
 * @fileoverview Simplified Static Vendor Manager (Phase 2.2 GREEN)
 * @description 간소화된 vendor manager - 자동 초기화 제거, 명시적 초기화만 제공
 *
 * TDD Phase: GREEN - 복잡한 자동화 제거, 명시적 초기화만 제공
 */

import { logger } from '@shared/logging';

// 정적 import로 모든 라이브러리를 안전하게 로드
import * as fflate from 'fflate';
import * as preact from 'preact';
import * as preactHooks from 'preact/hooks';
import * as preactSignals from '@preact/signals';
import * as preactCompat from 'preact/compat';

// 간단한 타입 정의들
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

export type VNode = import('preact').VNode;

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
  downloadBlob: (blob: Blob, filename: string) => void;
}

/**
 * 간소화된 Static Vendor Manager
 * - 자동 초기화 제거 (Phase 2.2 목표)
 * - 명시적 initialize() 호출만 제공
 * - 복잡한 메모리 관리 및 캐싱 제거
 */
export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;
  private isInitialized = false;

  private constructor() {
    // 간소화된 생성자 - 자동 초기화 없음
    logger.debug('StaticVendorManager: 간소화된 인스턴스 생성');
  }

  public static getInstance(): StaticVendorManager {
    StaticVendorManager.instance ??= new StaticVendorManager();
    return StaticVendorManager.instance;
  }

  /**
   * 명시적 초기화 (자동화 제거)
   */
  public initialize(): boolean {
    try {
      this.isInitialized = true;
      logger.info('StaticVendorManager: 명시적 초기화 완료');
      return true;
    } catch (error) {
      logger.error('StaticVendorManager: 초기화 실패', error);
      return false;
    }
  }

  /**
   * 초기화 상태 확인
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * vendor API 접근자들 (간소화)
   */
  public getFflate(): FflateAPI {
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

  public getPreact(): PreactAPI {
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

  public getPreactHooks(): PreactHooksAPI {
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

  public getPreactSignals(): PreactSignalsAPI {
    return {
      signal: preactSignals.signal,
      computed: preactSignals.computed,
      effect: preactSignals.effect,
      batch: preactSignals.batch,
      Signal: preactSignals.Signal,
      // ReadonlySignal은 type으로만 export되므로 제외
    };
  }

  public getPreactCompat(): PreactCompatAPI {
    return {
      forwardRef: preactCompat.forwardRef,
      memo: preactCompat.memo,
      lazy: preactCompat.lazy,
      Suspense: preactCompat.Suspense,
      createPortal: preactCompat.createPortal,
      unstable_batchedUpdates: preactCompat.unstable_batchedUpdates,
    };
  }

  public getNativeDownloadAPI(): NativeDownloadAPI {
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
   * 정리 (간소화)
   */
  public cleanup(): void {
    this.isInitialized = false;
    logger.info('StaticVendorManager: 정리 완료');
  }
}

// 레거시 호환성을 위한 기본 export
export default StaticVendorManager;
