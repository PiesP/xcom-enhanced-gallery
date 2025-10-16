/**
 * @fileoverview 정적 Import 기반 안전한 Vendor Manager (Solid.js)
 * @description TDZ 문제 없는 안전한 vendor 초기화를 위한 정적 import 기반 구현
 *
 * TDD Phase: GREEN - 정적 import로 TDZ 문제 해결 (Solid.js 마이그레이션)
 */

import { logger } from '../../logging';
import { globalTimerManager } from '../../utils/timer-management';
import type {
  ForwardRefComponent,
  MemoCompareFunction,
  PreactComponent,
  PreactCompat,
} from './vendor-types';

// 정적 import로 Solid.js 라이브러리를 안전하게 로드
import {
  createSignal,
  createEffect,
  createMemo,
  createResource,
  createContext,
  useContext,
  batch,
  untrack,
  on,
  onMount,
  onCleanup,
  Show,
  For,
  Switch,
  Match,
  Index,
  ErrorBoundary,
  Suspense,
  lazy,
  children as resolveChildren,
  mergeProps,
  splitProps,
  createRoot,
  createComponent,
} from 'solid-js';

import h from 'solid-js/h';

import { render } from 'solid-js/web';
import { createStore, produce } from 'solid-js/store';

const useRefCompat = <T>(initialValue: T | null = null): { current: T | null } => ({
  current: initialValue,
});

const useCallbackCompat = <T extends (...args: unknown[]) => unknown>(callback: T): T => callback;

const assignDisplayName = (
  target: unknown,
  source: unknown,
  wrapperName: 'memo' | 'forwardRef'
): void => {
  const functionTarget = target as { displayName?: string };
  const functionSource = source as { displayName?: string; name?: string };
  const sourceName = functionSource.displayName ?? functionSource.name ?? 'Component';
  Object.defineProperty(functionTarget, 'displayName', {
    configurable: true,
    enumerable: false,
    value: `${wrapperName}(${sourceName})`,
    writable: false,
  });
};

const memoCompat: PreactCompat['memo'] = <P>(
  Component: PreactComponent<P>,
  _compare?: MemoCompareFunction<P>
): PreactComponent<P> => {
  const MemoizedComponent: PreactComponent<P> = (props: P) => Component(props);
  assignDisplayName(MemoizedComponent, Component, 'memo');
  return MemoizedComponent;
};

const forwardRefCompat: PreactCompat['forwardRef'] = <P>(
  Component: ForwardRefComponent<P>
): PreactComponent<P> => {
  const ForwardedComponent: PreactComponent<P> = (props: P) => {
    const propsWithRef = props as P & { ref?: unknown };
    return Component(props, propsWithRef.ref);
  };
  assignDisplayName(ForwardedComponent, Component, 'forwardRef');
  return ForwardedComponent;
};

// 메모리 관리 상수
const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

// 타입 정의들 (Solid.js)
export interface SolidAPI {
  render: typeof render;
  createSignal: typeof createSignal;
  createEffect: typeof createEffect;
  createMemo: typeof createMemo;
  createStore: typeof createStore;
  produce: typeof produce;
  createResource: typeof createResource;
  createContext: typeof createContext;
  useContext: typeof useContext;
  batch: typeof batch;
  untrack: typeof untrack;
  on: typeof on;
  onMount: typeof onMount;
  onCleanup: typeof onCleanup;
  Show: typeof Show;
  For: typeof For;
  Switch: typeof Switch;
  Match: typeof Match;
  Index: typeof Index;
  ErrorBoundary: typeof ErrorBoundary;
  Suspense: typeof Suspense;
  lazy: typeof lazy;
  children: typeof resolveChildren;
  mergeProps: typeof mergeProps;
  splitProps: typeof splitProps;
  createRoot: typeof createRoot;
  createComponent: typeof createComponent;
  h: typeof h;
  useRef: typeof useRefCompat;
  useCallback: typeof useCallbackCompat;
  memo: PreactCompat['memo'];
  forwardRef: PreactCompat['forwardRef'];
}

export interface SolidStoreAPI {
  createStore: typeof createStore;
  produce: typeof produce;
}

export type JSXElement = import('solid-js').JSX.Element;
export type VNode = import('solid-js').JSX.Element;
export type ComponentChildren = import('solid-js').JSX.Element;

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// ================================
// 정적 벤더 매니저 (TDZ 안전, Solid.js)
// ================================

export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;

  // 정적으로 로드된 Solid.js API들 (TDZ 문제 없음)
  private readonly vendors = {
    solid: {
      render,
      createSignal,
      createEffect,
      createMemo,
      createStore,
      produce,
      createResource,
      createContext,
      useContext,
      batch,
      untrack,
      on,
      onMount,
      onCleanup,
      Show,
      For,
      Switch,
      Match,
      Index,
      ErrorBoundary,
      Suspense,
      lazy,
      children: resolveChildren,
      mergeProps,
      splitProps,
      createRoot,
      createComponent,
      h,
      useRef: useRefCompat,
      useCallback: useCallbackCompat,
      memo: memoCompat,
      forwardRef: forwardRefCompat,
    },
    store: {
      createStore,
      produce,
    },
  };

  // 검증된 API 캐시
  private readonly apiCache = new Map<string, unknown>();

  // 정리용 URL 추적
  private readonly createdUrls = new Set<string>();
  private readonly urlTimers = new Map<string, number>();

  // 초기화 상태 추적
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    logger.debug('StaticVendorManager: 인스턴스 생성 (Solid.js)');
  }

  public static getInstance(): StaticVendorManager {
    StaticVendorManager.instance ??= new StaticVendorManager();
    return StaticVendorManager.instance;
  }

  /**
   * 모든 vendor 초기화 (단일 실행 보장)
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      logger.debug('StaticVendorManager: 초기화 시작 (Solid.js)');

      // 정적 import된 모듈들을 검증
      this.validateStaticImports();

      // API 객체들을 캐시에 저장
      this.cacheAPIs();

      this.isInitialized = true;
      logger.info('✅ StaticVendorManager: Solid.js vendor 초기화 완료');
    } catch (error) {
      logger.error('❌ StaticVendorManager: 초기화 실패:', error);
      throw error;
    }
  }

  private validateStaticImports(): void {
    // Solid.js 코어 검증
    if (!this.vendors.solid.createSignal || typeof this.vendors.solid.createSignal !== 'function') {
      throw new Error('Solid.js 라이브러리 검증 실패');
    }

    // Solid.js Store 검증
    if (!this.vendors.store.createStore || typeof this.vendors.store.createStore !== 'function') {
      throw new Error('Solid.js Store 라이브러리 검증 실패');
    }

    logger.debug('✅ 모든 정적 import 검증 완료 (Solid.js)');
  }

  private cacheAPIs(): void {
    // Solid.js API
    const solidAPI: SolidAPI = {
      render: this.vendors.solid.render,
      createSignal: this.vendors.solid.createSignal,
      createEffect: this.vendors.solid.createEffect,
      createMemo: this.vendors.solid.createMemo,
      createStore: this.vendors.solid.createStore,
      produce: this.vendors.solid.produce,
      createResource: this.vendors.solid.createResource,
      createContext: this.vendors.solid.createContext,
      useContext: this.vendors.solid.useContext,
      batch: this.vendors.solid.batch,
      untrack: this.vendors.solid.untrack,
      on: this.vendors.solid.on,
      onMount: this.vendors.solid.onMount,
      onCleanup: this.vendors.solid.onCleanup,
      Show: this.vendors.solid.Show,
      For: this.vendors.solid.For,
      Switch: this.vendors.solid.Switch,
      Match: this.vendors.solid.Match,
      Index: this.vendors.solid.Index,
      ErrorBoundary: this.vendors.solid.ErrorBoundary,
      Suspense: this.vendors.solid.Suspense,
      lazy: this.vendors.solid.lazy,
      children: this.vendors.solid.children,
      mergeProps: this.vendors.solid.mergeProps,
      splitProps: this.vendors.solid.splitProps,
      createRoot: this.vendors.solid.createRoot,
      createComponent: this.vendors.solid.createComponent,
      h: this.vendors.solid.h,
      useRef: this.vendors.solid.useRef,
      useCallback: this.vendors.solid.useCallback,
      memo: this.vendors.solid.memo,
      forwardRef: this.vendors.solid.forwardRef,
    };

    // Solid.js Store API
    const solidStoreAPI: SolidStoreAPI = {
      createStore: this.vendors.store.createStore,
      produce: this.vendors.store.produce,
    };

    // 캐시에 저장
    this.apiCache.set('solid', solidAPI);
    this.apiCache.set('solid-store', solidStoreAPI);

    logger.debug('✅ 모든 API 캐시 완료 (Solid.js)');
  }

  /**
   * Solid.js 라이브러리 안전 접근
   */
  public getSolid(): SolidAPI {
    if (!this.isInitialized) {
      if (import.meta.env.MODE === 'test') {
        logger.debug('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      } else {
        logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      }
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('solid') as SolidAPI;
    if (!api) {
      throw new Error('Solid.js API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * Solid.js Store 안전 접근
   */
  public getSolidStore(): SolidStoreAPI {
    if (!this.isInitialized) {
      if (import.meta.env.MODE === 'test') {
        logger.debug('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      } else {
        logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      }
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('solid-store') as SolidStoreAPI;
    if (!api) {
      throw new Error('Solid.js Store API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * 네이티브 다운로드 API (메모리 관리 개선)
   * @deprecated Use getUserscript().download() instead for userscript compatibility
   * This is a fallback for non-userscript environments
   */
  public getNativeDownload(): NativeDownloadAPI {
    return {
      downloadBlob: (blob: Blob, filename: string): void => {
        let url: string | null = null;
        try {
          url = URL.createObjectURL(blob);
          this.createdUrls.add(url);

          const link = document.createElement('a');
          // codeql[js/unsafe-download-pattern] - Legacy fallback, prefer getUserscript().download()
          link.href = url;
          link.download = filename;
          link.style.display = 'none';

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          logger.debug('네이티브 다운로드 완료:', filename);
        } catch (error) {
          logger.error('Native download failed:', error);
          throw error;
        } finally {
          // finally 블록에서 확실한 정리
          if (url) {
            try {
              URL.revokeObjectURL(url);
              this.createdUrls.delete(url);
            } catch (revokeError) {
              logger.warn('URL 해제 실패:', revokeError);
            }
          }
        }
      },

      createDownloadUrl: (blob: Blob): string => {
        const url = URL.createObjectURL(blob);
        this.createdUrls.add(url);

        // 30초 후 자동 정리 (메모리 누수 방지 강화)
        const timerId = globalTimerManager.setTimeout(() => {
          if (this.createdUrls.has(url)) {
            try {
              URL.revokeObjectURL(url);
              this.createdUrls.delete(url);
            } catch (error) {
              logger.warn('자동 URL 정리 실패:', error);
            }
          }
        }, MEMORY_CONSTANTS.URL_CLEANUP_TIMEOUT);

        this.urlTimers.set(url, timerId);

        return url;
      },

      revokeDownloadUrl: (url: string): void => {
        try {
          // 타이머 정리
          const timerId = this.urlTimers.get(url);
          if (timerId) {
            globalTimerManager.clearTimeout(timerId);
            this.urlTimers.delete(url);
          }

          URL.revokeObjectURL(url);
          this.createdUrls.delete(url);
        } catch (error) {
          logger.warn('URL 해제 실패:', error);
        }
      },
    };
  }

  /**
   * 모든 라이브러리 검증
   */
  public async validateAll(): Promise<{
    success: boolean;
    loadedLibraries: string[];
    errors: string[];
  }> {
    const loadedLibraries: string[] = [];
    const errors: string[] = [];

    try {
      this.getSolid();
      loadedLibraries.push('Solid.js');
    } catch (error) {
      errors.push(`Solid.js: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getSolidStore();
      loadedLibraries.push('SolidStore');
    } catch (error) {
      errors.push(`SolidStore: ${error instanceof Error ? error.message : String(error)}`);
    }

    const success = errors.length === 0;

    if (success) {
      logger.info('모든 라이브러리 검증 완료', { loadedLibraries });
    } else {
      logger.error('라이브러리 검증 중 오류 발생', { errors });
    }

    return { success, loadedLibraries, errors };
  }

  /**
   * 라이브러리 버전 정보
   */
  public getVersionInfo() {
    return Object.freeze({
      solid: '1.9.9',
      signals: '2.3.1',
      motion: 'removed', // Motion One 완전 제거
    });
  }

  /**
   * 초기화 상태 확인
   */
  public getInitializationStatus() {
    return {
      isInitialized: this.isInitialized,
      hasInitializationPromise: !!this.initializationPromise,
      cacheSize: this.apiCache.size,
      availableAPIs: Array.from(this.apiCache.keys()),
    };
  }

  /**
   * 메모리 정리
   */
  public cleanup(): void {
    // 타이머들 정리
    this.urlTimers.forEach(timerId => {
      globalTimerManager.clearTimeout(timerId);
    });
    this.urlTimers.clear();

    // 생성된 URL들 정리
    this.createdUrls.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        logger.warn('URL 정리 중 오류:', error);
      }
    });
    this.createdUrls.clear();

    // 캐시 정리
    this.apiCache.clear();

    // 초기화 상태 리셋
    this.isInitialized = false;
    this.initializationPromise = null;

    logger.debug('StaticVendorManager: 메모리 정리 완료');
  }

  /**
   * 인스턴스 리셋 (테스트용)
   */
  public static resetInstance(): void {
    if (StaticVendorManager.instance) {
      StaticVendorManager.instance.cleanup();
      StaticVendorManager.instance = null;
    }
  }
}
