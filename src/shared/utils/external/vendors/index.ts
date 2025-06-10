/**
 * @fileoverview Optimized vendor library access for X.com Enhanced Gallery
 *
 * Simplified vendor utilities focused on essential functionality:
 * - fflate for ZIP compression
 * - Native browser download capabilities
 * - Preact components and hooks
 *
 * @module vendors
 * @version 3.0.0 (optimized - removed duplicates)
 */

import { logger } from '@infrastructure/logging/logger';

import { URL_CLEANUP_DELAY } from '@core/constants/MEDIA_CONSTANTS';

/**
 * Cached Preact modules for synchronous access
 */
let cachedPreact: PreactAPI | null = null;
let cachedPreactHooks: PreactHooksAPI | null = null;
let cachedPreactSignals: PreactSignalsAPI | null = null;

// Type definitions for external modules
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VNode = any; // 더 유연한 타입으로 변경
type ComponentType<P = {}> = (props: P) => VNode | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentClass<P = {}> = new (props: P) => any;
type ComponentChildren = VNode | string | number | boolean | null | undefined | ComponentChildren[];
type RefObject<T> = { current: T | null };
type Context<T> = {
  Provider: ComponentType<{ value: T; children?: ComponentChildren }>;
  Consumer: ComponentType<{ children: (value: T) => ComponentChildren }>;
};

// Hook types
type StateUpdater<T> = T | ((prevState: T) => T);
type Dispatch<T> = (value: T) => void;
type EffectCallback = () => void | (() => void);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DependencyList = ReadonlyArray<any>; // 더 유연한 타입으로 변경
type _ReducerAction<T> = T;
type Reducer<S, A> = (prevState: S, action: A) => S;

// Signal types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReadonlySignal<T = any> = { readonly value: T }; // 더 유연한 타입으로 변경
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Signal<T = any> = { value: T };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComputedSignal<T = any> = ReadonlySignal<T>;

/**
 * Core fflate ZIP functionality interface
 */
interface FflateAPI {
  zipSync: (files: { [filename: string]: Uint8Array }, options?: { level?: number }) => Uint8Array;
  zip: (
    files: { [filename: string]: Uint8Array },
    options: { level?: number },
    callback: (error: Error | null, data: Uint8Array) => void
  ) => void;
}

/**
 * Native browser download functionality
 */
interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

/**
 * Preact library interface with proper typing
 */
interface PreactAPI {
  h: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: string | ComponentType<any> | ComponentClass<any>, // 타입 개선
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null, // 타입 개선
    ...children: ComponentChildren[]
  ) => VNode;
  render: (component: VNode, container: Element | DocumentFragment) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentClass<any>; // 타입 개선
  Fragment: ComponentType<{ children?: ComponentChildren }>;
  createContext: <T>(defaultValue?: T) => Context<T>;
  cloneElement: (
    element: VNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null, // 타입 개선
    ...children: ComponentChildren[]
  ) => VNode;
  createRef: <T>() => RefObject<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isValidElement: (element: any) => element is VNode; // 타입 개선
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any>; // 타입 개선
  createElement: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: string | ComponentType<any> | ComponentClass<any>, // 타입 개선
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null, // 타입 개선
    ...children: ComponentChildren[]
  ) => VNode;
}

/**
 * Preact hooks interface with proper typing
 */
interface PreactHooksAPI {
  useState: <T>(initialState: T | (() => T)) => [T, Dispatch<StateUpdater<T>>];
  useEffect: (effect: EffectCallback, deps?: DependencyList) => void;
  useRef: <T>(initialValue: T) => RefObject<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useCallback: <T extends (...args: any[]) => any>(callback: T, deps: DependencyList) => T;
  useMemo: <T>(factory: () => T, deps: DependencyList) => T;
  useReducer: <S, A>(reducer: Reducer<S, A>, initialState: S) => [S, Dispatch<A>];
  useContext: <T>(context: Context<T>) => T;
  useLayoutEffect: (effect: EffectCallback, deps?: DependencyList) => void;
  useImperativeHandle: <T>(ref: RefObject<T>, createHandle: () => T, deps?: DependencyList) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useDebugValue: <T>(value: T, format?: (value: T) => any) => void; // 타입 개선
  forwardRef: <T, P = {}>(
    render: (props: P, ref: RefObject<T>) => VNode | null
  ) => ComponentType<P & { ref?: RefObject<T> }>;
}

/**
 * Preact signals interface with proper typing
 */
interface PreactSignalsAPI {
  signal: <T>(value: T) => Signal<T>;
  computed: <T>(compute: () => T) => ComputedSignal<T>;
  effect: (fn: () => void) => () => void;
  batch: <T>(fn: () => T) => T;
  useSignal: <T>(value: T) => Signal<T>;
  useComputed: <T>(compute: () => T) => ComputedSignal<T>;
  useSignalEffect: (fn: () => void) => void;
}

// Window interface extension for external libraries
interface ExtendedWindow extends Window {
  preact?: unknown;
  preactHooks?: unknown;
  preactSignals?: unknown;
}

/**
 * Get fflate library instance
 */
export async function getFflate(): Promise<FflateAPI | null> {
  try {
    // Try dynamic import first (most reliable)
    const fflateModule = await import('fflate');
    return {
      zipSync: fflateModule.zipSync,
      zip: fflateModule.zip,
    };
  } catch (error) {
    logger.warn('Failed to load fflate library:', error);
    return null;
  }
}

/**
 * Get native browser download functionality
 */
export function getNativeDownload(): NativeDownloadAPI {
  return {
    downloadBlob(blob: Blob, filename: string): void {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up URL after download starts
        setTimeout(() => URL.revokeObjectURL(url), URL_CLEANUP_DELAY);
      } catch (error) {
        logger.error('Native download failed:', error);
        throw error;
      }
    },

    createDownloadUrl(blob: Blob): string {
      return URL.createObjectURL(blob);
    },

    revokeDownloadUrl(url: string): void {
      URL.revokeObjectURL(url);
    },
  };
}

/**
 * Preact 라이브러리 인스턴스를 가져옵니다.
 *
 * @description 캐시된 인스턴스를 반환하거나 동적으로 로드합니다.
 * Node.js 환경에서는 require를 사용하고, 브라우저에서는 window 객체에서 접근합니다.
 *
 * @returns Preact API 인스턴스
 * @throws {Error} Preact가 사용할 수 없는 경우
 *
 * @example
 * ```typescript
 * const preact = getPreact();
 * const { h, render } = preact;
 *
 * // JSX 렌더링
 * render(h('div', null, 'Hello World'), document.body);
 * ```
 */
export function getPreact(): PreactAPI {
  if (cachedPreact) {
    return cachedPreact;
  }

  // 동적 require 시도 (Node.js 환경)
  try {
    const preactModule = require('preact') as Record<string, unknown>;
    cachedPreact = {
      h: preactModule.h as PreactAPI['h'],
      render: preactModule.render as PreactAPI['render'],
      Component: preactModule.Component as PreactAPI['Component'],
      Fragment: preactModule.Fragment as PreactAPI['Fragment'],
      createContext: preactModule.createContext as PreactAPI['createContext'],
      cloneElement: preactModule.cloneElement as PreactAPI['cloneElement'],
      createRef: preactModule.createRef as PreactAPI['createRef'],
      isValidElement: preactModule.isValidElement as PreactAPI['isValidElement'],
      options: preactModule.options as PreactAPI['options'],
      createElement: preactModule.h as PreactAPI['createElement'], // h와 createElement는 동일
    };
    return cachedPreact;
  } catch {
    // Browser 환경에서는 window 객체에서 접근
    const extWindow = (typeof window !== 'undefined' ? window : undefined) as
      | ExtendedWindow
      | undefined;
    if (extWindow?.preact) {
      const preactModule = extWindow.preact as Record<string, unknown>;
      cachedPreact = {
        h: preactModule.h as PreactAPI['h'],
        render: preactModule.render as PreactAPI['render'],
        Component: preactModule.Component as PreactAPI['Component'],
        Fragment: preactModule.Fragment as PreactAPI['Fragment'],
        createContext: preactModule.createContext as PreactAPI['createContext'],
        cloneElement: preactModule.cloneElement as PreactAPI['cloneElement'],
        createRef: preactModule.createRef as PreactAPI['createRef'],
        isValidElement: preactModule.isValidElement as PreactAPI['isValidElement'],
        options: preactModule.options as PreactAPI['options'],
        createElement: preactModule.h as PreactAPI['createElement'],
      };
      return cachedPreact;
    }
  }

  throw new Error('Preact is not available');
}

/**
 * Preact Hooks API를 가져옵니다.
 *
 * @description useState, useEffect 등의 훅들을 포함한 API를 반환합니다.
 *
 * @returns Preact Hooks API 인스턴스
 * @throws {Error} Preact hooks가 사용할 수 없는 경우
 *
 * @example
 * ```typescript
 * const { useState, useEffect } = getPreactHooks();
 *
 * function MyComponent() {
 *   const [count, setCount] = useState(0);
 *
 *   useEffect(() => {
 *     console.log('Count changed:', count);
 *   }, [count]);
 *
 *   return h('button', { onClick: () => setCount(c => c + 1) }, count);
 * }
 * ```
 */
export function getPreactHooks(): PreactHooksAPI {
  if (cachedPreactHooks) {
    return cachedPreactHooks;
  }

  try {
    const hooksModule = require('preact/hooks') as Record<string, unknown>;

    const compatModule = require('preact/compat') as Record<string, unknown>;
    const hooks: PreactHooksAPI = {
      useState: hooksModule.useState as PreactHooksAPI['useState'],
      useEffect: hooksModule.useEffect as PreactHooksAPI['useEffect'],
      useRef: hooksModule.useRef as PreactHooksAPI['useRef'],
      useCallback: hooksModule.useCallback as PreactHooksAPI['useCallback'],
      useMemo: hooksModule.useMemo as PreactHooksAPI['useMemo'],
      useReducer: hooksModule.useReducer as PreactHooksAPI['useReducer'],
      useContext: hooksModule.useContext as PreactHooksAPI['useContext'],
      useLayoutEffect: hooksModule.useLayoutEffect as PreactHooksAPI['useLayoutEffect'],
      useImperativeHandle: hooksModule.useImperativeHandle as PreactHooksAPI['useImperativeHandle'],
      useDebugValue: hooksModule.useDebugValue as PreactHooksAPI['useDebugValue'],
      forwardRef: compatModule.forwardRef as PreactHooksAPI['forwardRef'],
    };
    cachedPreactHooks = hooks;
    return hooks;
  } catch {
    const extWindow = (typeof window !== 'undefined' ? window : undefined) as
      | ExtendedWindow
      | undefined;
    if (extWindow?.preactHooks) {
      const hooks = extWindow.preactHooks as PreactHooksAPI;
      cachedPreactHooks = hooks;
      return hooks;
    }
  }

  throw new Error('Preact hooks are not available');
}

/**
 * Preact Signals API를 가져옵니다.
 *
 * @description signal, computed, effect 등의 반응형 상태 관리 API를 반환합니다.
 *
 * @returns Preact Signals API 인스턴스
 * @throws {Error} Preact signals가 사용할 수 없는 경우
 *
 * @example
 * ```typescript
 * const { signal, computed, effect } = getPreactSignals();
 *
 * const count = signal(0);
 * const doubled = computed(() => count.value * 2);
 *
 * effect(() => {
 *   console.log('Count:', count.value, 'Doubled:', doubled.value);
 * });
 *
 * count.value = 5; // 콘솔에 "Count: 5 Doubled: 10" 출력
 * ```
 */
export function getPreactSignals(): PreactSignalsAPI {
  if (cachedPreactSignals) {
    return cachedPreactSignals;
  }

  try {
    const signalsModule = require('@preact/signals') as Record<string, unknown>;
    const signals: PreactSignalsAPI = {
      signal: signalsModule.signal as PreactSignalsAPI['signal'],
      computed: signalsModule.computed as PreactSignalsAPI['computed'],
      effect: signalsModule.effect as PreactSignalsAPI['effect'],
      batch: signalsModule.batch as PreactSignalsAPI['batch'],
      useSignal: signalsModule.useSignal as PreactSignalsAPI['useSignal'],
      useComputed: signalsModule.useComputed as PreactSignalsAPI['useComputed'],
      useSignalEffect: signalsModule.useSignalEffect as PreactSignalsAPI['useSignalEffect'],
    };
    cachedPreactSignals = signals;
    return signals;
  } catch {
    const extWindow = (typeof window !== 'undefined' ? window : undefined) as
      | ExtendedWindow
      | undefined;
    if (extWindow?.preactSignals) {
      const signals = extWindow.preactSignals as PreactSignalsAPI;
      cachedPreactSignals = signals;
      return signals;
    }
  }

  throw new Error('Preact signals are not available');
}

// Export types
export type {
  ComponentChildren,
  ComponentType,
  ComputedSignal,
  Context,
  DependencyList,
  // Hook types
  Dispatch,
  EffectCallback,
  FflateAPI,
  NativeDownloadAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  ReadonlySignal,
  Reducer,
  RefObject,
  // Signal types
  Signal,
  StateUpdater,
  VNode,
};
