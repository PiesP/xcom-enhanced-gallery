/**
 * Core External Vendor Manager Implementation
 */

import { logger } from '../../logging';

// 메모리 관리 상수
const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

// 타입 정의들
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

export type VNode = import('preact').VNode;

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

export type ComponentChildren = import('preact').ComponentChildren;

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// ================================
// 벤더 매니저 싱글톤
// ================================

export class VendorManager {
  private static instance: VendorManager | null = null;

  // 로드된 라이브러리 캐시
  private readonly cache = new Map<string, unknown>();

  // 정리용 URL 추적
  private readonly createdUrls = new Set<string>();
  private readonly urlTimers = new Map<string, number>();

  private constructor() {
    logger.debug('VendorManager: 인스턴스 생성');
  }

  public static getInstance(): VendorManager {
    VendorManager.instance ??= new VendorManager();
    return VendorManager.instance;
  }

  /**
   * fflate 라이브러리 안전 접근
   */
  public async getFflate(): Promise<FflateAPI> {
    const cacheKey = 'fflate';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as FflateAPI;
    }

    try {
      const fflate = await import('fflate');

      if (!fflate.deflate || typeof fflate.deflate !== 'function') {
        throw new Error('fflate 라이브러리 검증 실패');
      }

      const api: FflateAPI = {
        zip: fflate.zip,
        unzip: fflate.unzip,
        strToU8: fflate.strToU8,
        strFromU8: fflate.strFromU8,
        zipSync: fflate.zipSync,
        unzipSync: fflate.unzipSync,
        deflate: fflate.deflate,
        inflate: fflate.inflate,
      };

      this.cache.set(cacheKey, api);
      logger.debug('fflate 로드 성공');
      return api;
    } catch (error) {
      logger.error('fflate 로드 실패:', error);
      throw new Error('fflate 라이브러리를 사용할 수 없습니다');
    }
  }

  /**
   * Preact 라이브러리 안전 접근
   */
  public async getPreact(): Promise<PreactAPI> {
    const cacheKey = 'preact';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as PreactAPI;
    }

    try {
      const preact = await import('preact');

      if (!preact.render || typeof preact.render !== 'function') {
        throw new Error('Preact 라이브러리 검증 실패');
      }

      const api: PreactAPI = {
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

      this.cache.set(cacheKey, api);
      logger.debug('Preact 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact 로드 실패:', error);
      throw new Error('Preact 라이브러리를 사용할 수 없습니다');
    }
  }

  /**
   * Preact Hooks 안전 접근
   */
  public async getPreactHooks(): Promise<PreactHooksAPI> {
    const cacheKey = 'preact-hooks';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as PreactHooksAPI;
    }

    try {
      const hooks = await import('preact/hooks');

      if (!hooks.useState || typeof hooks.useState !== 'function') {
        throw new Error('Preact Hooks 라이브러리 검증 실패');
      }

      const api: PreactHooksAPI = {
        useState: hooks.useState,
        useEffect: hooks.useEffect,
        useMemo: hooks.useMemo,
        useCallback: hooks.useCallback,
        useRef: hooks.useRef,
        useContext: hooks.useContext,
        useReducer: hooks.useReducer,
        useLayoutEffect: hooks.useLayoutEffect,
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact Hooks 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact Hooks 로드 실패:', error);
      throw new Error('Preact Hooks 라이브러리를 사용할 수 없습니다');
    }
  }

  /**
   * Preact Signals 안전 접근
   */
  public async getPreactSignals(): Promise<PreactSignalsAPI> {
    const cacheKey = 'preact-signals';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as PreactSignalsAPI;
    }

    try {
      const signals = await import('@preact/signals');

      if (!signals.signal || typeof signals.signal !== 'function') {
        throw new Error('Preact Signals 라이브러리 검증 실패');
      }

      const api: PreactSignalsAPI = {
        signal: signals.signal,
        computed: signals.computed,
        effect: signals.effect,
        batch: signals.batch,
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact Signals 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact Signals 로드 실패:', error);
      throw new Error('Preact Signals 라이브러리를 사용할 수 없습니다');
    }
  }

  /**
   * Preact Compat 라이브러리 안전 접근
   */
  public async getPreactCompat(): Promise<PreactCompatAPI> {
    const cacheKey = 'preact-compat';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as PreactCompatAPI;
    }

    try {
      const compat = await import('preact/compat');

      if (
        !compat.forwardRef ||
        typeof compat.forwardRef !== 'function' ||
        !compat.memo ||
        typeof compat.memo !== 'function'
      ) {
        throw new Error('Preact Compat 라이브러리 검증 실패');
      }

      const api: PreactCompatAPI = {
        forwardRef: compat.forwardRef,
        memo: compat.memo,
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact Compat 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact Compat 로드 실패:', error);
      throw new Error('Preact Compat 라이브러리를 사용할 수 없습니다');
    }
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
    const results = await Promise.allSettled([
      this.getFflate().then(() => 'fflate'),
      this.getPreact().then(() => 'Preact'),
      this.getPreactHooks().then(() => 'PreactHooks'),
      this.getPreactSignals().then(() => 'PreactSignals'),
    ]);

    const loadedLibraries: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loadedLibraries.push(result.value);
      } else {
        const libNames = ['fflate', 'Preact', 'PreactHooks', 'PreactSignals'];
        errors.push(`${libNames[index]}: ${result.reason.message}`);
      }
    });

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
      preact: '10.26.9',
      signals: '2.2.0',
      motion: 'removed', // Motion One 완전 제거
    });
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
    this.cache.clear();

    logger.debug('VendorManager: 메모리 정리 완료');
  }
}
