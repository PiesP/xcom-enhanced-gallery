/**
 * @fileoverview Lazy Virtual Scroll Service - VirtualScrollManager 지연 로딩
 * @version 1.0.0
 * @description 대용량 리스트에서만 VirtualScrollManager를 동적으로 로드하여 초기 번들 크기 최적화
 */

import { logger } from '@shared/logging/logger';

/**
 * VirtualScrollManager API 타입 정의 (독립적)
 */
/**
 * VirtualScrollManager API 타입 정의 (독립적)
 */
export interface LazyVirtualScrollManager {
  getVisibleRange(scrollTop: number, totalItems: number): { start: number; end: number };
  getRenderRange(
    visibleStart: number,
    visibleEnd: number,
    totalItems: number
  ): { start: number; end: number };
  handleScroll(scrollTop: number, totalItems: number): void;
  updateConfig(
    config: Partial<{ itemHeight: number; viewportHeight: number; bufferSize: number }>
  ): void;
  isEnabled(): boolean;
  shouldUseVirtualScroll(itemCount: number): boolean;
}

/**
 * VirtualScrollManager 지연 로딩 결과
 */
export interface LazyVirtualScrollResult {
  success: boolean;
  manager?: LazyVirtualScrollManager;
  error?: string;
}

/**
 * VirtualScrollManager 지연 로딩 서비스
 *
 * 대용량 리스트(50개 이상 아이템)에서만 VirtualScrollManager를 로드하여
 * 초기 번들 크기를 최적화합니다.
 */
export class LazyVirtualScrollService {
  private static manager: LazyVirtualScrollManager | null = null;
  private static isLoading = false;
  private static loadPromise: Promise<LazyVirtualScrollResult> | null = null;
  private static readonly VIRTUAL_SCROLL_THRESHOLD = 50;

  /**
   * VirtualScrollManager 동적 로딩
   */
  static async loadVirtualScrollManager(): Promise<LazyVirtualScrollManager> {
    // 이미 로드된 경우 캐시된 인스턴스 반환
    if (this.manager) {
      logger.debug('LazyVirtualScrollService: 캐시된 VirtualScrollManager 반환');
      return this.manager;
    }

    // 로딩 중인 경우 동일한 Promise 반환
    if (this.isLoading && this.loadPromise) {
      logger.debug('LazyVirtualScrollService: VirtualScrollManager 로딩 중, 대기...');
      const result = await this.loadPromise;
      if (result.success && result.manager) {
        return result.manager;
      }
      throw new Error(result.error || 'VirtualScrollManager 로딩 실패');
    }

    // 새로운 로딩 시작
    this.isLoading = true;
    this.loadPromise = this.performLoad();

    try {
      const result = await this.loadPromise;
      if (result.success && result.manager) {
        this.manager = result.manager;
        return result.manager;
      }
      throw new Error(result.error || 'VirtualScrollManager 로딩 실패');
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * 실제 VirtualScrollManager 로딩 수행
   */
  private static async performLoad(): Promise<LazyVirtualScrollResult> {
    try {
      logger.debug('LazyVirtualScrollService: VirtualScrollManager 동적 로딩 시작');

      // 동적 import를 통한 VirtualScrollManager 로딩
      const { VirtualScrollManager } = await import('@shared/utils/virtual-scroll');

      if (!VirtualScrollManager) {
        throw new Error('VirtualScrollManager 클래스를 찾을 수 없습니다');
      }

      // VirtualScrollManager 인스턴스 생성
      const manager = new VirtualScrollManager({
        threshold: this.VIRTUAL_SCROLL_THRESHOLD,
        viewportHeight: 800,
        itemHeight: 100,
        bufferSize: 5,
        enabled: true,
      });

      logger.debug('LazyVirtualScrollService: VirtualScrollManager 로딩 완료');

      return {
        success: true,
        manager: manager as unknown as LazyVirtualScrollManager,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      logger.error('LazyVirtualScrollService: VirtualScrollManager 로딩 실패', error);

      return {
        success: false,
        error: `VirtualScrollManager 로딩 실패: ${errorMessage}`,
      };
    }
  }

  /**
   * 아이템 수에 따른 VirtualScrollManager 필요 여부 판단
   */
  static async shouldLoadForItemCount(itemCount: number): Promise<boolean> {
    const shouldLoad = itemCount >= this.VIRTUAL_SCROLL_THRESHOLD;

    logger.debug('LazyVirtualScrollService: VirtualScrollManager 필요 여부 판단', {
      itemCount,
      threshold: this.VIRTUAL_SCROLL_THRESHOLD,
      shouldLoad,
    });

    return shouldLoad;
  }

  /**
   * 아이템 수에 따른 조건부 VirtualScrollManager 로딩
   */
  static async loadIfNeeded(itemCount: number): Promise<LazyVirtualScrollManager | null> {
    const shouldLoad = await this.shouldLoadForItemCount(itemCount);

    if (!shouldLoad) {
      logger.debug('LazyVirtualScrollService: VirtualScrollManager 로딩 불필요 (임계값 이하)');
      return null;
    }

    return await this.loadVirtualScrollManager();
  }

  /**
   * VirtualScrollManager 캐시 초기화
   */
  static clearCache(): void {
    logger.debug('LazyVirtualScrollService: 캐시 초기화');
    this.manager = null;
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * 현재 VirtualScrollManager 상태 확인
   */
  static getStatus(): {
    isLoaded: boolean;
    isLoading: boolean;
    hasCache: boolean;
  } {
    return {
      isLoaded: !!this.manager,
      isLoading: this.isLoading,
      hasCache: !!this.manager,
    };
  }
}

/**
 * 편의 함수: 조건부 가상 스크롤 생성
 */
export async function createVirtualScrollWhenNeeded(
  container: unknown,
  itemCount: number,
  options?: Record<string, unknown>
): Promise<LazyVirtualScrollManager | null> {
  if (!container) {
    logger.warn('LazyVirtualScrollService: 유효하지 않은 컨테이너');
    return null;
  }

  const manager = await LazyVirtualScrollService.loadIfNeeded(itemCount);

  if (manager && options) {
    manager.updateConfig(options);
  }

  return manager;
}

/**
 * 편의 함수: 가상 스크롤 필요 여부만 확인
 */
export async function checkVirtualScrollNeed(itemCount: number): Promise<boolean> {
  return await LazyVirtualScrollService.shouldLoadForItemCount(itemCount);
}

/**
 * 편의 함수: 가상 스크롤 즉시 로딩 (테스트용)
 */
export async function forceLoadVirtualScroll(): Promise<LazyVirtualScrollManager> {
  return await LazyVirtualScrollService.loadVirtualScrollManager();
}
