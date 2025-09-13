/**
 * @fileoverview 정적 Import 기반 안전한 Vendor Manager
 * @description TDZ 문제 없는 안전한 vendor 초기화를 위한 정적 import 기반 구현
 *
 * TDD Phase: GREEN - 정적 import로 TDZ 문제 해결
 */

import { logger } from '../../logging';

// 정적 import로 모든 라이브러리를 안전하게 로드
import * as fflate from 'fflate';
import * as preact from 'preact';
import * as preactHooks from 'preact/hooks';
import * as preactSignals from '@preact/signals';
import * as preactCompat from 'preact/compat';

// 메모리 관리 상수
const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

// 타입 정의들 (기존과 동일)
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
  useMemo: typeof preactHooks.useMemo;
  useCallback: typeof preactHooks.useCallback;
  useRef: typeof preactHooks.useRef;
  useContext: typeof preactHooks.useContext;
  useReducer: typeof preactHooks.useReducer;
  useLayoutEffect: typeof preactHooks.useLayoutEffect;
}

export interface PreactSignalsAPI {
  signal: typeof preactSignals.signal;
  computed: typeof preactSignals.computed;
  effect: typeof preactSignals.effect;
  batch: typeof preactSignals.batch;
}

export interface PreactCompatAPI {
  forwardRef: typeof preactCompat.forwardRef;
  memo: typeof preactCompat.memo;
  createElement: typeof preactCompat.createElement;
}

export type ComponentChildren = import('preact').ComponentChildren;

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// ================================
// 정적 벤더 매니저 (TDZ 안전)
// ================================

export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;

  // 정적으로 로드된 라이브러리들 (TDZ 문제 없음)
  private readonly vendors = {
    fflate,
    preact,
    preactHooks,
    preactSignals,
    preactCompat,
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
    logger.debug('StaticVendorManager: 인스턴스 생성');
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
      logger.debug('StaticVendorManager: 초기화 시작');

      // 정적 import된 모듈들을 검증
      this.validateStaticImports();

      // API 객체들을 캐시에 저장
      this.cacheAPIs();

      this.isInitialized = true;
      logger.info('✅ StaticVendorManager: 모든 vendor 초기화 완료');
    } catch (error) {
      logger.error('❌ StaticVendorManager: 초기화 실패:', error);
      throw error;
    }
  }

  private validateStaticImports(): void {
    // fflate 검증
    if (!this.vendors.fflate.deflate || typeof this.vendors.fflate.deflate !== 'function') {
      throw new Error('fflate 라이브러리 검증 실패');
    }

    // Preact 검증
    if (!this.vendors.preact.render || typeof this.vendors.preact.render !== 'function') {
      throw new Error('Preact 라이브러리 검증 실패');
    }

    // Preact Hooks 검증
    if (
      !this.vendors.preactHooks.useState ||
      typeof this.vendors.preactHooks.useState !== 'function'
    ) {
      throw new Error('Preact Hooks 라이브러리 검증 실패');
    }

    // Preact Signals 검증
    if (
      !this.vendors.preactSignals.signal ||
      typeof this.vendors.preactSignals.signal !== 'function'
    ) {
      throw new Error('Preact Signals 라이브러리 검증 실패');
    }

    // Preact Compat 검증
    if (
      !this.vendors.preactCompat.forwardRef ||
      typeof this.vendors.preactCompat.forwardRef !== 'function' ||
      !this.vendors.preactCompat.memo ||
      typeof this.vendors.preactCompat.memo !== 'function' ||
      !this.vendors.preactCompat.createElement ||
      typeof this.vendors.preactCompat.createElement !== 'function'
    ) {
      throw new Error('Preact Compat 라이브러리 검증 실패');
    }

    logger.debug('✅ 모든 정적 import 검증 완료');
  }

  private cacheAPIs(): void {
    // fflate API
    const fflateAPI: FflateAPI = {
      zip: this.vendors.fflate.zip,
      unzip: this.vendors.fflate.unzip,
      strToU8: this.vendors.fflate.strToU8,
      strFromU8: this.vendors.fflate.strFromU8,
      zipSync: this.vendors.fflate.zipSync,
      unzipSync: this.vendors.fflate.unzipSync,
      deflate: this.vendors.fflate.deflate,
      inflate: this.vendors.fflate.inflate,
    };

    // Preact API
    const preactAPI: PreactAPI = {
      h: this.vendors.preact.h,
      render: this.vendors.preact.render,
      Component: this.vendors.preact.Component,
      Fragment: this.vendors.preact.Fragment,
      createContext: this.vendors.preact.createContext,
      cloneElement: this.vendors.preact.cloneElement,
      createRef: this.vendors.preact.createRef,
      isValidElement: this.vendors.preact.isValidElement,
      options: this.vendors.preact.options,
      createElement: this.vendors.preact.createElement,
    };

    // Preact Hooks API
    const preactHooksAPI: PreactHooksAPI = {
      useState: this.vendors.preactHooks.useState,
      useEffect: this.vendors.preactHooks.useEffect,
      useMemo: this.vendors.preactHooks.useMemo,
      useCallback: this.vendors.preactHooks.useCallback,
      useRef: this.vendors.preactHooks.useRef,
      useContext: this.vendors.preactHooks.useContext,
      useReducer: this.vendors.preactHooks.useReducer,
      useLayoutEffect: this.vendors.preactHooks.useLayoutEffect,
    };

    // Preact Signals API
    const preactSignalsAPI: PreactSignalsAPI = {
      signal: this.vendors.preactSignals.signal,
      computed: this.vendors.preactSignals.computed,
      effect: this.vendors.preactSignals.effect,
      batch: this.vendors.preactSignals.batch,
    };

    // Preact Compat API
    const preactCompatAPI: PreactCompatAPI = {
      forwardRef: this.vendors.preactCompat.forwardRef,
      memo: this.vendors.preactCompat.memo,
      createElement: this.vendors.preactCompat.createElement,
    };

    // 캐시에 저장
    this.apiCache.set('fflate', fflateAPI);
    this.apiCache.set('preact', preactAPI);
    this.apiCache.set('preact-hooks', preactHooksAPI);
    this.apiCache.set('preact-signals', preactSignalsAPI);
    this.apiCache.set('preact-compat', preactCompatAPI);

    logger.debug('✅ 모든 API 캐시 완료');
  }

  /**
   * fflate 라이브러리 안전 접근
   */
  public getFflate(): FflateAPI {
    if (!this.isInitialized) {
      logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      // 동기 초기화 시도 (정적 import이므로 안전)
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('fflate') as FflateAPI;
    if (!api) {
      throw new Error('fflate API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * Preact 라이브러리 안전 접근
   */
  public getPreact(): PreactAPI {
    if (!this.isInitialized) {
      logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('preact') as PreactAPI;
    if (!api) {
      throw new Error('Preact API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * Preact Hooks 안전 접근
   */
  public getPreactHooks(): PreactHooksAPI {
    if (!this.isInitialized) {
      logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('preact-hooks') as PreactHooksAPI;
    if (!api) {
      throw new Error('Preact Hooks API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * Preact Signals 안전 접근
   */
  public getPreactSignals(): PreactSignalsAPI {
    if (!this.isInitialized) {
      logger.warn('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('preact-signals') as PreactSignalsAPI;
    if (!api) {
      throw new Error('Preact Signals API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * Preact Compat 안전 접근 (TDZ 문제 해결)
   */
  public getPreactCompat(): PreactCompatAPI {
    if (!this.isInitialized) {
      logger.debug('StaticVendorManager가 초기화되지 않았습니다. 자동 초기화를 시도합니다.');
      this.validateStaticImports();
      this.cacheAPIs();
      this.isInitialized = true;
    }

    const api = this.apiCache.get('preact-compat') as PreactCompatAPI;
    if (!api) {
      throw new Error('Preact Compat API를 찾을 수 없습니다.');
    }
    return api;
  }

  /**
   * 네이티브 다운로드 API (메모리 관리 개선)
   */
  public getNativeDownload(): NativeDownloadAPI {
    return {
      downloadBlob: (blob: Blob, filename: string): void => {
        let url: string | null = null;
        try {
          url = URL.createObjectURL(blob);
          this.createdUrls.add(url);

          const link = document.createElement('a');
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
        const timerId = window.setTimeout(() => {
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
            clearTimeout(timerId);
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
      this.getFflate();
      loadedLibraries.push('fflate');
    } catch (error) {
      errors.push(`fflate: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getPreact();
      loadedLibraries.push('Preact');
    } catch (error) {
      errors.push(`Preact: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getPreactHooks();
      loadedLibraries.push('PreactHooks');
    } catch (error) {
      errors.push(`PreactHooks: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getPreactSignals();
      loadedLibraries.push('PreactSignals');
    } catch (error) {
      errors.push(`PreactSignals: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getPreactCompat();
      loadedLibraries.push('PreactCompat');
    } catch (error) {
      errors.push(`PreactCompat: ${error instanceof Error ? error.message : String(error)}`);
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
      fflate: '0.8.2',
      preact: '10.27.1',
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
      clearTimeout(timerId);
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
