/**
 * @fileoverview 정적 Import 기반 안전한 Vendor Manager
 * @description TDZ 문제 없는 안전한 vendor 초기화를 위한 정적 import 기반 구현
 *
 * TDD Phase: GREEN - 정적 import로 TDZ 문제 해결
 * Phase 1: Solid.js 지원 추가
 */

import { logger } from '../../logging';
import { globalTimerManager } from '../../utils/timer-management';

// Phase 6: Solid.js only - Preact 제거 완료
import * as solid from 'solid-js';
import * as solidWeb from 'solid-js/web';

// 메모리 관리 상수
const MEMORY_CONSTANTS = {
  MAX_CACHE_SIZE: 50,
  CLEANUP_INTERVAL: 30000,
  INSTANCE_TIMEOUT: 300000,
  URL_CLEANUP_TIMEOUT: 60000,
} as const;

// Phase 6: Solid.js only - Preact 타입 제거 완료

export interface NativeDownloadAPI {
  downloadBlob: (blob: Blob, filename: string) => void;
  createDownloadUrl: (blob: Blob) => string;
  revokeDownloadUrl: (url: string) => void;
}

// ================================
// Solid.js 타입 정의
// ================================

export interface SolidAPI {
  // Primitives
  createSignal: typeof solid.createSignal;
  createEffect: typeof solid.createEffect;
  createMemo: typeof solid.createMemo;
  createRoot: typeof solid.createRoot;
  createResource: typeof solid.createResource;
  batch: typeof solid.batch;
  untrack: typeof solid.untrack;
  on: typeof solid.on;
  onMount: typeof solid.onMount;
  onCleanup: typeof solid.onCleanup;

  // Props utilities
  mergeProps: typeof solid.mergeProps;
  splitProps: typeof solid.splitProps;

  // Components
  Show: typeof solid.Show;
  For: typeof solid.For;
  ErrorBoundary: typeof solid.ErrorBoundary;
}

export interface SolidWebAPI {
  render: typeof solidWeb.render;
  hydrate: typeof solidWeb.hydrate;
  renderToString: typeof solidWeb.renderToString;
  isServer: typeof solidWeb.isServer;

  // Components
  Dynamic: typeof solidWeb.Dynamic;
  Portal: typeof solidWeb.Portal;
  Show: typeof solidWeb.Show;
}

// Re-export types from solid-js (타입만 export)
export type { Component, JSX, Accessor } from 'solid-js';

// ================================
// 정적 벤더 매니저 (TDZ 안전)
// ================================

export class StaticVendorManager {
  private static instance: StaticVendorManager | null = null;

  // Phase 6: Solid.js only - Preact vendors 제거 완료
  private readonly vendors = {
    solid,
    solidWeb,
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
    // Phase 6: Solid.js only - Preact 검증 제거 완료

    // Solid.js 검증
    if (!this.vendors.solid.createSignal || typeof this.vendors.solid.createSignal !== 'function') {
      throw new Error('Solid.js 라이브러리 검증 실패');
    }

    // Solid Web 검증
    if (!this.vendors.solidWeb.render || typeof this.vendors.solidWeb.render !== 'function') {
      throw new Error('Solid.js Web 라이브러리 검증 실패');
    }

    logger.debug('✅ 모든 정적 import 검증 완료 (Solid.js)');
  }

  private cacheAPIs(): void {
    // Phase 6: Solid.js only - Preact API 캐싱 제거 완료

    // Solid.js API (런타임 값만 캐시)
    const solidAPI: SolidAPI = {
      // Primitives
      createSignal: this.vendors.solid.createSignal,
      createEffect: this.vendors.solid.createEffect,
      createMemo: this.vendors.solid.createMemo,
      createRoot: this.vendors.solid.createRoot,
      createResource: this.vendors.solid.createResource,
      batch: this.vendors.solid.batch,
      untrack: this.vendors.solid.untrack,
      on: this.vendors.solid.on,
      onMount: this.vendors.solid.onMount,
      onCleanup: this.vendors.solid.onCleanup,

      // Props utilities
      mergeProps: this.vendors.solid.mergeProps,
      splitProps: this.vendors.solid.splitProps,

      // Components
      Show: this.vendors.solid.Show,
      For: this.vendors.solid.For,
      ErrorBoundary: this.vendors.solid.ErrorBoundary,
    };

    // Solid.js Web API
    const solidWebAPI: SolidWebAPI = {
      render: this.vendors.solidWeb.render,
      hydrate: this.vendors.solidWeb.hydrate,
      renderToString: this.vendors.solidWeb.renderToString,
      isServer: this.vendors.solidWeb.isServer,

      // Components
      Dynamic: this.vendors.solidWeb.Dynamic,
      Portal: this.vendors.solidWeb.Portal,
      Show: this.vendors.solidWeb.Show,
    };

    // 캐시에 저장
    this.apiCache.set('solid', solidAPI);
    this.apiCache.set('solid-web', solidWebAPI);

    logger.debug('✅ 모든 API 캐시 완료 (Solid.js)');
  }

  // Phase 6: Preact getter 메서드 모두 제거 완료

  /**
   * Solid.js 안전 접근 - 항상 정적 import 반환 (TDZ 방지)
   */
  public getSolid(): SolidAPI {
    // 캐시된 API 객체를 반환 (Show 등의 컴포넌트 중복 방지)
    const cached = this.apiCache.get('solid') as SolidAPI | undefined;
    if (cached) {
      return cached;
    }

    // 캐시가 없으면 직접 API 객체 생성하여 반환
    const solidAPI: SolidAPI = {
      // Primitives
      createSignal: this.vendors.solid.createSignal,
      createEffect: this.vendors.solid.createEffect,
      createMemo: this.vendors.solid.createMemo,
      createRoot: this.vendors.solid.createRoot,
      createResource: this.vendors.solid.createResource,
      batch: this.vendors.solid.batch,
      untrack: this.vendors.solid.untrack,
      on: this.vendors.solid.on,
      onMount: this.vendors.solid.onMount,
      onCleanup: this.vendors.solid.onCleanup,

      // Props utilities
      mergeProps: this.vendors.solid.mergeProps,
      splitProps: this.vendors.solid.splitProps,

      // Components
      Show: this.vendors.solid.Show,
      For: this.vendors.solid.For,
      ErrorBoundary: this.vendors.solid.ErrorBoundary,
    };

    return solidAPI;
  }

  /**
   * Solid.js Web 안전 접근 - 항상 정적 import 반환 (TDZ 방지)
   */
  public getSolidWeb(): SolidWebAPI {
    // 캐시된 API 객체를 반환
    const cached = this.apiCache.get('solid-web') as SolidWebAPI | undefined;
    if (cached) {
      return cached;
    }

    // 캐시가 없으면 직접 API 객체 생성하여 반환
    const solidWebAPI: SolidWebAPI = {
      render: this.vendors.solidWeb.render,
      hydrate: this.vendors.solidWeb.hydrate,
      renderToString: this.vendors.solidWeb.renderToString,
      isServer: this.vendors.solidWeb.isServer,

      // Components
      Dynamic: this.vendors.solidWeb.Dynamic,
      Portal: this.vendors.solidWeb.Portal,
      Show: this.vendors.solidWeb.Show,
    };

    return solidWebAPI;
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

    // Phase 6: Preact 검증 제거, Solid.js만 유지

    try {
      this.getSolid();
      loadedLibraries.push('Solid.js');
    } catch (error) {
      errors.push(`Solid.js: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      this.getSolidWeb();
      loadedLibraries.push('Solid.js Web');
    } catch (error) {
      errors.push(`Solid.js Web: ${error instanceof Error ? error.message : String(error)}`);
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
      solid: '1.9.5',
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
