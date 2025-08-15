/**
 * Vendor API Types - 순환 의존성 방지용 타입 정의
 */

export interface FflateAPI {
  zip: typeof import('fflate').zip;
  unzip: typeof import('fflate').unzip;
  strToU8: typeof import('fflate').strToU8;
  strFromU8: typeof import('fflate').strFromU8;
  zipSync: typeof import('fflate').zipSync;
  unzipSync: typeof import('fflate').unzipSync;
  deflate: typeof import('fflate').deflate;
  inflate: typeof import('fflate').inflate;
}

export interface PreactAPI {
  h: typeof import('preact').h;
  render: typeof import('preact').render;
  Component: typeof import('preact').Component;
  Fragment: typeof import('preact').Fragment;
  createContext: typeof import('preact').createContext;
  cloneElement: typeof import('preact').cloneElement;
  createRef: typeof import('preact').createRef;
  isValidElement: typeof import('preact').isValidElement;
  options: typeof import('preact').options;
  createElement: typeof import('preact').createElement;
}

export interface PreactHooksAPI {
  useState: typeof import('preact/hooks').useState;
  useEffect: typeof import('preact/hooks').useEffect;
  useMemo: typeof import('preact/hooks').useMemo;
  useCallback: typeof import('preact/hooks').useCallback;
  useRef: typeof import('preact/hooks').useRef;
  useContext: typeof import('preact/hooks').useContext;
  useReducer: typeof import('preact/hooks').useReducer;
  useLayoutEffect: typeof import('preact/hooks').useLayoutEffect;
}

export interface PreactSignalsAPI {
  signal: typeof import('@preact/signals').signal;
  computed: typeof import('@preact/signals').computed;
  effect: typeof import('@preact/signals').effect;
  batch: typeof import('@preact/signals').batch;
}

export interface PreactCompatAPI {
  forwardRef: typeof import('preact/compat').forwardRef;
  memo: typeof import('preact/compat').memo;
}

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

export type VNode = import('preact').VNode;
export type Ref<T = unknown> = import('preact').Ref<T>;
export type ComponentChildren = import('preact').ComponentChildren;
