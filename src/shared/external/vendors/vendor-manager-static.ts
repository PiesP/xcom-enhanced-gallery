/**
 * @fileoverview Simplified Static Vendor Manager (Phase 2.2 GREEN)
 * @description 간소화된 vendor manager - 자동 초기화 제거, 명시적 초기화만 제공
 *
 * TDD Phase: GREEN - 복잡한 자동화 제거, 명시적 초기화만 제공
 */

import { logger } from '@shared/logging';

// 정적 import로 모든 라이브러리를 안전하게 로드
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

// 간단한 타입 정의들
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

export type VNode = import('preact').VNode;
export type ComponentChildren = import('preact').ComponentChildren;

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

  public getPreact(): PreactAPI {
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

  public getPreactHooks(): PreactHooksAPI {
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

  public getPreactSignals(): PreactSignalsAPI {
    return {
      signal,
      computed,
      effect,
      batch,
      Signal,
      // ReadonlySignal은 type으로만 export되므로 제외
    };
  }

  public getPreactCompat(): PreactCompatAPI {
    return {
      forwardRef,
      memo,
      lazy,
      Suspense,
      createPortal,
      unstable_batchedUpdates,
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
