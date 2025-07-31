import { logger } from '@shared/logging';

const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 20,
  CLEANUP_INTERVAL: 60000,
  INSTANCE_TIMEOUT: 600000,
  URL_CLEANUP_TIMEOUT: 30000,
} as const;

// 타입 정의들
export interface FflateAPI {
  zip: typeof import('fflate').zip;
  unzip: typeof import('fflate').unzip;
  deflate: typeof import('fflate').deflate;
  strToU8: typeof import('fflate').strToU8;
  strFromU8: typeof import('fflate').strFromU8;
  zipSync: typeof import('fflate').zipSync;
}

export interface PreactAPI {
  h: typeof import('preact').h;
  render: typeof import('preact').render;
  Component: typeof import('preact').Component;
  Fragment: typeof import('preact').Fragment;
  createElement: typeof import('preact').createElement;
  createContext: typeof import('preact').createContext;
}

export type VNode = import('preact').VNode;

export interface PreactHooksAPI {
  useState: typeof import('preact/hooks').useState;
  useEffect: typeof import('preact/hooks').useEffect;
  useMemo: typeof import('preact/hooks').useMemo;
  useRef: typeof import('preact/hooks').useRef;
  useCallback: typeof import('preact/hooks').useCallback;
}

export interface PreactSignalsAPI {
  signal: typeof import('@preact/signals').signal;
  computed: typeof import('@preact/signals').computed;
  effect: typeof import('@preact/signals').effect;
}

export interface PreactCompatAPI {
  forwardRef: typeof import('preact/compat').forwardRef;
  memo: typeof import('preact/compat').memo;
}

export type ComponentChildren = import('preact').ComponentChildren;

// Motion API
export interface MotionAPI {
  animate: (
    element: Element,
    keyframes: Keyframe[] | PropertyIndexedKeyframes | Record<string, unknown>,
    options?: { duration?: number; easing?: string }
  ) => Promise<Animation | void>;
  scroll: (
    onScroll: (info: { scrollY: number }) => void,
    options?: { container?: Element | null }
  ) => () => void;
}

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// TanStack API 타입들
export interface TanStackQueryAPI {
  QueryClient: typeof import('@tanstack/query-core').QueryClient;
}

export interface TanStackVirtualAPI {
  useVirtualizer: typeof import('@tanstack/react-virtual').useVirtualizer;
}

export class VendorManager {
  private static instance: VendorManager | null = null;
  private readonly cache = new Map<string, unknown>();
  private readonly createdUrls = new Set<string>();
  private readonly urlTimers = new Map<string, number>();

  private constructor() {
    logger.debug('VendorManager: 인스턴스 생성');
  }

  public static getInstance(): VendorManager {
    VendorManager.instance ??= new VendorManager();
    return VendorManager.instance;
  }

  // fflate 라이브러리 안전 접근
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
        deflate: fflate.deflate,
        strToU8: fflate.strToU8,
        strFromU8: fflate.strFromU8,
        zipSync: fflate.zipSync,
      };

      this.cache.set(cacheKey, api);
      logger.debug('fflate 로드 성공');
      return api;
    } catch (error) {
      logger.error('fflate 로드 실패:', error);
      throw new Error('fflate 라이브러리를 사용할 수 없습니다');
    }
  }

  // Preact 라이브러리 안전 접근
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
        createElement: preact.createElement,
        createContext: preact.createContext,
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact 로드 실패:', error);
      throw new Error('Preact 라이브러리를 사용할 수 없습니다');
    }
  }

  // Preact Hooks 안전 접근
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
        useRef: hooks.useRef,
        useCallback: hooks.useCallback,
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact Hooks 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact Hooks 로드 실패:', error);
      throw new Error('Preact Hooks 라이브러리를 사용할 수 없습니다');
    }
  }

  // Preact Signals 안전 접근
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
      };

      this.cache.set(cacheKey, api);
      logger.debug('Preact Signals 로드 성공');
      return api;
    } catch (error) {
      logger.error('Preact Signals 로드 실패:', error);
      throw new Error('Preact Signals 라이브러리를 사용할 수 없습니다');
    }
  }

  // Preact Compat 라이브러리 안전 접근
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
   * Motion One 애니메이션 라이브러리 안전 접근
   */
  public getMotion(): MotionAPI {
    // Motion One은 이미 전역에서 사용 가능한 것으로 가정
    // 또는 번들에 포함된 것으로 처리
    try {
      // 기본적인 모킹 구현 - 실제 프로젝트에서는 번들된 motion 라이브러리 사용
      const api: MotionAPI = {
        animate: async (
          element: Element,
          keyframes: Keyframe[] | PropertyIndexedKeyframes | Record<string, unknown>,
          _options?: { duration?: number; easing?: string; delay?: number }
        ): Promise<Animation | void> => {
          // 기본 애니메이션 폴백
          if (
            element instanceof HTMLElement &&
            typeof keyframes === 'object' &&
            !Array.isArray(keyframes)
          ) {
            Object.assign(element.style, keyframes);
          }
          return Promise.resolve();
        },
        scroll: (
          onScroll: (info: { scrollY: number; progress: number }) => void,
          _options?: { container?: Element | null }
        ): (() => void) => {
          const handler = () => {
            const scrollY = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
            onScroll({ scrollY, progress });
          };
          window.addEventListener('scroll', handler);
          return () => window.removeEventListener('scroll', handler);
        },
      };

      this.cache.set('motion', api);
      logger.debug('Motion API 준비 완료 (폴백 구현)');
      return api;
    } catch (error) {
      logger.error('Motion API 초기화 실패:', error);
      throw new Error('Motion 라이브러리를 사용할 수 없습니다');
    }
  }

  // Motion One 애니메이션 라이브러리 접근 (간소화됨)
  public async getMotionOne(): Promise<MotionAPI> {
    const cacheKey = 'motion-one';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as MotionAPI;
    }

    try {
      const api: MotionAPI = {
        animate: async (element, keyframes, options = {}) => {
          const { duration = 300, easing = 'ease' } = options;
          let animationKeyframes: Keyframe[] | PropertyIndexedKeyframes;

          if (Array.isArray(keyframes)) {
            animationKeyframes = keyframes;
          } else if (typeof keyframes === 'object' && keyframes !== null) {
            animationKeyframes = keyframes as PropertyIndexedKeyframes;
          } else {
            return Promise.resolve();
          }

          const animation = element.animate(animationKeyframes, {
            duration,
            easing,
            fill: 'forwards',
          });
          await animation.finished;
          return animation;
        },

        scroll: (onScroll, options = {}) => {
          const { container = window } = options;
          const handleScroll = () => {
            const scrollY =
              container === window ? window.scrollY : (container as Element).scrollTop;
            onScroll({ scrollY });
          };

          if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
          }
          return () => {};
        },
      };

      this.cache.set(cacheKey, api);
      logger.debug('Motion One 로드 성공');
      return api;
    } catch (error) {
      logger.error('Motion One 로드 실패:', error);
      throw new Error('Motion 라이브러리를 사용할 수 없습니다');
    }
  }

  // 네이티브 다운로드 API (메모리 관리 개선)
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
          logger.error('네이티브 다운로드 실패:', error);
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

  // TanStack Query Core 안전 접근
  public async getTanStackQuery(): Promise<TanStackQueryAPI> {
    const cacheKey = 'tanstack-query';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as TanStackQueryAPI;
    }

    try {
      const query = await import('@tanstack/query-core');

      if (!query.QueryClient || typeof query.QueryClient !== 'function') {
        throw new Error('TanStack Query 라이브러리 검증 실패');
      }

      const api: TanStackQueryAPI = {
        QueryClient: query.QueryClient,
      };

      this.cache.set(cacheKey, api);
      logger.debug('TanStack Query 로드 성공');
      return api;
    } catch (error) {
      logger.error('TanStack Query 로드 실패:', error);
      throw new Error('TanStack Query 라이브러리를 사용할 수 없습니다');
    }
  }

  // TanStack Virtual 안전 접근
  public async getTanStackVirtual(): Promise<TanStackVirtualAPI> {
    const cacheKey = 'tanstack-virtual';

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as TanStackVirtualAPI;
    }

    try {
      const virtual = await import('@tanstack/react-virtual');

      if (!virtual.useVirtualizer || typeof virtual.useVirtualizer !== 'function') {
        throw new Error('TanStack Virtual 라이브러리 검증 실패');
      }

      const api: TanStackVirtualAPI = {
        useVirtualizer: virtual.useVirtualizer,
      };

      this.cache.set(cacheKey, api);
      logger.debug('TanStack Virtual 로드 성공');
      return api;
    } catch (error) {
      logger.error('TanStack Virtual 로드 실패:', error);
      throw new Error('TanStack Virtual 라이브러리를 사용할 수 없습니다');
    }
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
      Promise.resolve(this.getMotion()).then(() => 'Motion'),
      this.getMotionOne().then(() => 'MotionOne'),
      this.getTanStackQuery().then(() => 'TanStackQuery'),
      this.getTanStackVirtual().then(() => 'TanStackVirtual'),
    ]);

    const loadedLibraries: string[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        loadedLibraries.push(result.value);
      } else {
        const libNames = [
          'fflate',
          'Preact',
          'PreactHooks',
          'PreactSignals',
          'Motion',
          'MotionOne',
          'TanStackQuery',
          'TanStackVirtual',
        ];
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
      motion: '12.23.11', // Motion 버전
      tanStackQuery: '5.17.19',
      tanStackVirtual: '3.0.1',
    });
  }

  // 메모리 정리
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
