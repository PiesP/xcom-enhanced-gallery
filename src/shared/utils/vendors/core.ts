/**
 * @fileoverview Core vendor library implementations
 *
 * Core implementations for vendor library access
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
export type VNode = any;
export type ComponentType<P = {}> = (props: P) => VNode | null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentClass<P = {}> = new (props: P) => any;
export type ComponentChildren =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];
export type RefObject<T> = { current: T | null };
export type Context<T> = {
  Provider: ComponentType<{ value: T; children?: ComponentChildren }>;
  Consumer: ComponentType<{ children: (value: T) => ComponentChildren }>;
};

// Hook types
export type StateUpdater<T> = T | ((prevState: T) => T);
export type Dispatch<T> = (value: T) => void;
export type EffectCallback = () => void | (() => void);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DependencyList = ReadonlyArray<any>;
export type _ReducerAction<T> = T;
export type Reducer<S, A> = (prevState: S, action: A) => S;

// Signal types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReadonlySignal<T = any> = { readonly value: T };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Signal<T = any> = { value: T };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComputedSignal<T = any> = ReadonlySignal<T>;

/**
 * Core fflate ZIP functionality interface
 */
export interface FflateAPI {
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
export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

/**
 * Preact library interface with proper typing
 */
export interface PreactAPI {
  h: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: string | ComponentType<any> | ComponentClass<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null,
    ...children: ComponentChildren[]
  ) => VNode;
  render: (component: VNode, container: Element | DocumentFragment) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentClass<any>;
  Fragment: ComponentType<{ children?: ComponentChildren }>;
  createContext: <T>(defaultValue?: T) => Context<T>;
  cloneElement: (
    element: VNode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null,
    ...children: ComponentChildren[]
  ) => VNode;
  createRef: <T>() => RefObject<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isValidElement: (element: any) => element is VNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: Record<string, any>;
  createElement: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type: string | ComponentType<any> | ComponentClass<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props?: Record<string, any> | null,
    ...children: ComponentChildren[]
  ) => VNode;
}

/**
 * Preact hooks interface with proper typing
 */
export interface PreactHooksAPI {
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
  useDebugValue: <T>(value: T, format?: (value: T) => any) => void;
  forwardRef: <T, P = {}>(
    render: (props: P, ref: RefObject<T>) => VNode | null
  ) => ComponentType<P & { ref?: RefObject<T> }>;
}

/**
 * Preact signals interface with proper typing
 */
export interface PreactSignalsAPI {
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
