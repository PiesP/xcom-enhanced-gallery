/**
 * Core External Vendor Manager Implementation
 */

import { logger } from '@shared/logging';
// 순환 의존성 방지: bundled 모듈들을 직접 import하지 않고 dynamic getter 사용
import type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
} from './types';

// Re-export types for compatibility
export type {
  FflateAPI,
  PreactAPI,
  PreactHooksAPI,
  PreactSignalsAPI,
  PreactCompatAPI,
  NativeDownloadAPI,
  VNode,
  Ref,
  ComponentChildren,
} from './types';

// 메모리 관리 상수
const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

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
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as FflateAPI;

    // 직접 구현하여 순환 의존성 제거
    const globalFflate = (window as unknown as { fflate?: FflateAPI }).fflate;
    if (globalFflate) {
      this.cache.set(cacheKey, globalFflate);
      return globalFflate;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { fflateBundled } = await import('../fflate-bundled');
      if (fflateBundled && typeof fflateBundled.zip === 'function') {
        const api = fflateBundled as unknown as FflateAPI;
        this.cache.set(cacheKey, api);
        return api;
      }
      throw new Error('Bundled fflate 모듈이 유효하지 않습니다');
    } catch (error) {
      logger.error('[CSP Safe] fflate must be bundled, external loading disabled:', error);
      throw new Error('fflate 로드를 실패했습니다 - 번들에 포함되어야 합니다');
    }
  }

  /**
   * Preact 라이브러리 안전 접근
   */
  public async getPreact(): Promise<PreactAPI> {
    const cacheKey = 'preact';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as PreactAPI;

    const globalPreact = (window as unknown as { preact?: PreactAPI }).preact;
    if (globalPreact) {
      this.cache.set(cacheKey, globalPreact);
      return globalPreact;
    }

    logger.error('[CSP Safe] window.preact 가 필요합니다 (@require 누락)');
    throw new Error('Preact 전역이 없습니다. Userscript 헤더의 @require를 확인하세요.');
  }

  /**
   * Preact Hooks 안전 접근
   */
  public async getPreactHooks(): Promise<PreactHooksAPI> {
    const cacheKey = 'preact-hooks';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as PreactHooksAPI;

    const globalHooks = (window as unknown as { preactHooks?: PreactHooksAPI }).preactHooks;
    if (globalHooks) {
      this.cache.set(cacheKey, globalHooks);
      return globalHooks;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { preactHooks: bundledHooks } = await import('../hooks-bundled');
      if (bundledHooks && typeof bundledHooks.useState === 'function') {
        this.cache.set(cacheKey, bundledHooks);
        return bundledHooks;
      }
      throw new Error('Bundled hooks 모듈이 유효하지 않습니다');
    } catch (error) {
      logger.error('[CSP Safe] Preact Hooks must be bundled, external loading disabled:', error);
      throw new Error('Preact Hooks 로드를 실패했습니다 - 번들에 포함되어야 합니다');
    }
  }

  /**
   * Preact Signals 안전 접근
   */
  public async getPreactSignals(): Promise<PreactSignalsAPI> {
    const cacheKey = 'preact-signals';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as PreactSignalsAPI;

    const globalSignals =
      (window as unknown as { preactSignals?: PreactSignalsAPI }).preactSignals ||
      (window as unknown as { signals?: PreactSignalsAPI }).signals;
    if (globalSignals) {
      this.cache.set(cacheKey, globalSignals);
      return globalSignals;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { preactSignals: bundledSignals } = await import('../signals-bundled');
      if (bundledSignals && typeof bundledSignals.signal === 'function') {
        this.cache.set(cacheKey, bundledSignals);
        return bundledSignals;
      }
      throw new Error('Bundled signals 모듈이 유효하지 않습니다');
    } catch (error) {
      logger.error('[CSP Safe] Preact Signals must be bundled, external loading disabled:', error);
      throw new Error('Preact Signals 로드를 실패했습니다 - 번들에 포함되어야 합니다');
    }
  }

  /**
   * Preact Compat 라이브러리 안전 접근
   */
  public async getPreactCompat(): Promise<PreactCompatAPI> {
    const cacheKey = 'preact-compat';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey) as PreactCompatAPI;

    const globalCompat = (window as unknown as { preactCompat?: PreactCompatAPI }).preactCompat;
    if (globalCompat) {
      this.cache.set(cacheKey, globalCompat);
      return globalCompat;
    }

    try {
      // Dynamic import to avoid circular dependency
      const { preactCompat: bundledCompat } = await import('../compat-bundled');
      if (bundledCompat && typeof bundledCompat.memo === 'function') {
        const api = bundledCompat as unknown as PreactCompatAPI;
        this.cache.set(cacheKey, api);
        return api;
      }
      throw new Error('Bundled compat 모듈이 유효하지 않습니다');
    } catch (error) {
      logger.error('[CSP Safe] Preact Compat must be bundled, external loading disabled:', error);
      throw new Error('Preact Compat 로드를 실패했습니다 - 번들에 포함되어야 합니다');
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
      motion: '12.23.11', // Motion 버전
      tanStackQuery: '5.17.19',
      tanStackVirtual: '3.0.1',
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
