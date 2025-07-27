/**
 * @fileoverview 런타임 성능 최적화된 리소스 관리자
 * @description Phase 4: 메모리 효율적인 리소스 관리 시스템
 * @version 4.0.0
 */

import { logger } from '@shared/logging/logger';

/**
 * 리소스 타입
 */
export type ResourceType = 'image' | 'video' | 'audio' | 'blob' | 'cache' | 'subscription';

/**
 * 리소스 항목
 */
interface ResourceItem {
  id: string;
  type: ResourceType;
  resource: unknown;
  size: number;
  lastAccessed: number;
  accessCount: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * 리소스 관리 옵션
 */
interface ResourceManagerOptions {
  /** 최대 메모리 사용량 (바이트, 기본: 100MB) */
  maxMemoryUsage?: number;
  /** 최대 리소스 개수 (기본: 1000) */
  maxResourceCount?: number;
  /** 정리 간격 (기본: 30초) */
  cleanupInterval?: number;
  /** 비활성 리소스 TTL (기본: 5분) */
  inactiveResourceTTL?: number;
  /** 메모리 압박 임계값 (기본: 80%) */
  memoryPressureThreshold?: number;
}

/**
 * 런타임 최적화된 리소스 관리자
 *
 * 성능 최적화 특징:
 * - 적응형 메모리 관리
 * - LRU 기반 자동 정리
 * - 메모리 압박 감지 및 대응
 * - 타입별 리소스 추적
 * - 페이지 가시성 기반 최적화
 */
export class OptimizedResourceManager {
  private static instance: OptimizedResourceManager | null = null;

  private readonly resources = new Map<string, ResourceItem>();
  private readonly typeCounters = new Map<ResourceType, number>();
  private readonly options: Required<ResourceManagerOptions>;
  private cleanupTimer: number | null = null;
  private currentMemoryUsage = 0;

  // 성능 메트릭
  private readonly metrics = {
    totalAllocated: 0,
    totalReleased: 0,
    peakMemoryUsage: 0,
    cleanupOperations: 0,
    memoryPressureEvents: 0,
    lastCleanup: Date.now(),
  };

  private constructor(options: ResourceManagerOptions = {}) {
    this.options = {
      maxMemoryUsage: options.maxMemoryUsage ?? 100 * 1024 * 1024, // 100MB
      maxResourceCount: options.maxResourceCount ?? 1000,
      cleanupInterval: options.cleanupInterval ?? 30000, // 30초
      inactiveResourceTTL: options.inactiveResourceTTL ?? 5 * 60 * 1000, // 5분
      memoryPressureThreshold: options.memoryPressureThreshold ?? 0.8, // 80%
    };

    this.initializeResourceManager();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(options?: ResourceManagerOptions): OptimizedResourceManager {
    if (!this.instance) {
      this.instance = new OptimizedResourceManager(options);
    }
    return this.instance;
  }

  /**
   * 리소스 관리자 초기화
   */
  private initializeResourceManager(): void {
    // 주기적 정리 스케줄링
    this.schedulePeriodicCleanup();

    // 페이지 가시성 이벤트 리스너
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performInactiveResourceCleanup();
      }
    });

    // 메모리 압박 감지 (브라우저 지원 시)
    if ('memory' in performance) {
      this.scheduleMemoryPressureCheck();
    }
  }

  /**
   * 리소스 할당
   */
  allocate<T = unknown>(
    id: string,
    type: ResourceType,
    resource: T,
    size: number = 0,
    metadata?: Record<string, unknown>
  ): boolean {
    // 중복 ID 체크
    if (this.resources.has(id)) {
      logger.warn(`Resource with ID ${id} already exists`);
      return false;
    }

    // 메모리 한계 체크
    if (this.currentMemoryUsage + size > this.options.maxMemoryUsage) {
      if (!this.performMemoryPressureCleanup()) {
        logger.warn('Cannot allocate resource: memory limit exceeded');
        return false;
      }
    }

    // 리소스 개수 한계 체크
    if (this.resources.size >= this.options.maxResourceCount) {
      this.performLRUCleanup(1);
    }

    const item: ResourceItem = {
      id,
      type,
      resource,
      size,
      lastAccessed: Date.now(),
      accessCount: 1,
      isActive: true,
      ...(metadata && { metadata }),
    };

    this.resources.set(id, item);
    this.currentMemoryUsage += size;
    this.updateTypeCounter(type, 1);

    // 메트릭 업데이트
    this.metrics.totalAllocated++;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, this.currentMemoryUsage);

    logger.debug(`Resource allocated: ${id} (${type}, ${size} bytes)`);
    return true;
  }

  /**
   * 리소스 접근
   */
  access<T = unknown>(id: string): T | null {
    const item = this.resources.get(id);
    if (!item) {
      return null;
    }

    // 접근 메타데이터 업데이트
    item.lastAccessed = Date.now();
    item.accessCount++;
    item.isActive = true;

    return item.resource as T;
  }

  /**
   * 리소스 해제
   */
  release(id: string): boolean {
    const item = this.resources.get(id);
    if (!item) {
      return false;
    }

    // 리소스 정리
    this.cleanupResource(item);
    this.resources.delete(id);
    this.currentMemoryUsage -= item.size;
    this.updateTypeCounter(item.type, -1);

    this.metrics.totalReleased++;

    logger.debug(`Resource released: ${id} (${item.type}, ${item.size} bytes)`);
    return true;
  }

  /**
   * 타입별 리소스 해제
   */
  releaseByType(type: ResourceType): number {
    let releasedCount = 0;
    const itemsToRelease = Array.from(this.resources.values()).filter(item => item.type === type);

    for (const item of itemsToRelease) {
      if (this.release(item.id)) {
        releasedCount++;
      }
    }

    return releasedCount;
  }

  /**
   * 리소스 비활성화
   */
  deactivate(id: string): void {
    const item = this.resources.get(id);
    if (item) {
      item.isActive = false;
    }
  }

  /**
   * 주기적 정리 스케줄링
   */
  private schedulePeriodicCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup();
    }, this.options.cleanupInterval) as unknown as number;
  }

  /**
   * 주기적 정리 수행
   */
  private performPeriodicCleanup(): void {
    const now = Date.now();
    const itemsToRelease: string[] = [];

    // 비활성 리소스 정리
    for (const [id, item] of this.resources.entries()) {
      if (!item.isActive && now - item.lastAccessed > this.options.inactiveResourceTTL) {
        itemsToRelease.push(id);
      }
    }

    // 배치 해제
    itemsToRelease.forEach(id => this.release(id));

    this.metrics.cleanupOperations++;
    this.metrics.lastCleanup = now;

    if (itemsToRelease.length > 0) {
      logger.debug(`Periodic cleanup: released ${itemsToRelease.length} resources`);
    }
  }

  /**
   * 비활성 리소스 정리
   */
  private performInactiveResourceCleanup(): void {
    const itemsToDeactivate: string[] = [];

    for (const [id, item] of this.resources.entries()) {
      if (item.isActive && item.type !== 'subscription') {
        item.isActive = false;
        itemsToDeactivate.push(id);
      }
    }

    logger.debug(`Deactivated ${itemsToDeactivate.length} resources on page hide`);
  }

  /**
   * 메모리 압박 정리
   */
  private performMemoryPressureCleanup(): boolean {
    const targetReduction = this.currentMemoryUsage * 0.3; // 30% 감소 목표
    let releasedMemory = 0;

    // 비활성 리소스 우선 정리
    const inactiveItems = Array.from(this.resources.values())
      .filter(item => !item.isActive)
      .sort((a, b) => a.lastAccessed - b.lastAccessed); // 오래된 것부터

    for (const item of inactiveItems) {
      if (releasedMemory >= targetReduction) break;

      this.release(item.id);
      releasedMemory += item.size;
    }

    // 필요시 활성 리소스도 정리 (LRU)
    if (releasedMemory < targetReduction) {
      const additionalCleanup = Math.ceil(this.resources.size * 0.1); // 10%
      this.performLRUCleanup(additionalCleanup);
    }

    this.metrics.memoryPressureEvents++;

    logger.debug(`Memory pressure cleanup: released ${releasedMemory} bytes`);
    return releasedMemory > 0;
  }

  /**
   * LRU 기반 정리
   */
  private performLRUCleanup(count: number): void {
    const sortedItems = Array.from(this.resources.values()).sort(
      (a, b) => a.lastAccessed - b.lastAccessed
    );

    for (let i = 0; i < Math.min(count, sortedItems.length); i++) {
      const item = sortedItems[i];
      if (item) {
        this.release(item.id);
      }
    }
  }

  /**
   * 메모리 압박 체크 스케줄링
   */
  private scheduleMemoryPressureCheck(): void {
    setInterval(() => {
      const memoryUsageRatio = this.currentMemoryUsage / this.options.maxMemoryUsage;

      if (memoryUsageRatio > this.options.memoryPressureThreshold) {
        this.performMemoryPressureCleanup();
      }
    }, 10000); // 10초마다 체크
  }

  /**
   * 리소스 정리 (타입별 커스텀 로직)
   */
  private cleanupResource(item: ResourceItem): void {
    try {
      switch (item.type) {
        case 'image':
          if (item.resource instanceof HTMLImageElement) {
            item.resource.src = '';
            item.resource.removeAttribute('src');
          }
          break;

        case 'video':
          if (item.resource instanceof HTMLVideoElement) {
            item.resource.pause();
            item.resource.src = '';
            item.resource.load();
          }
          break;

        case 'audio':
          if (item.resource instanceof HTMLAudioElement) {
            item.resource.pause();
            item.resource.src = '';
          }
          break;

        case 'blob':
          if (
            item.resource instanceof Blob ||
            (typeof item.resource === 'string' && item.resource.startsWith('blob:'))
          ) {
            URL.revokeObjectURL(item.resource.toString());
          }
          break;

        case 'subscription':
          if (
            item.resource &&
            typeof (item.resource as { unsubscribe?: () => void }).unsubscribe === 'function'
          ) {
            (item.resource as { unsubscribe: () => void }).unsubscribe();
          }
          break;

        case 'cache':
          // 커스텀 캐시 정리 로직
          if (
            item.resource &&
            typeof (item.resource as { clear?: () => void }).clear === 'function'
          ) {
            (item.resource as { clear: () => void }).clear();
          }
          break;
      }
    } catch (error) {
      logger.warn(`Error cleaning up resource ${item.id}:`, error);
    }
  }

  /**
   * 타입 카운터 업데이트
   */
  private updateTypeCounter(type: ResourceType, delta: number): void {
    const current = this.typeCounters.get(type) || 0;
    this.typeCounters.set(type, Math.max(0, current + delta));
  }

  /**
   * 리소스 상태 조회
   */
  getResourceInfo(id: string) {
    const item = this.resources.get(id);
    if (!item) return null;

    return {
      id: item.id,
      type: item.type,
      size: item.size,
      lastAccessed: item.lastAccessed,
      accessCount: item.accessCount,
      isActive: item.isActive,
      ageInMs: Date.now() - item.lastAccessed,
    };
  }

  /**
   * 전체 메트릭 조회
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentMemoryUsage: this.currentMemoryUsage,
      resourceCount: this.resources.size,
      memoryUsageRatio: this.currentMemoryUsage / this.options.maxMemoryUsage,
      typeBreakdown: Object.fromEntries(this.typeCounters),
      averageResourceSize:
        this.resources.size > 0 ? this.currentMemoryUsage / this.resources.size : 0,
    };
  }

  /**
   * 리소스 할당 (별칭: addResource - 테스트 호환성)
   */
  addResource<T = unknown>(
    id: string,
    type: ResourceType,
    resource: T,
    size: number = 0,
    metadata?: Record<string, unknown>
  ): boolean {
    return this.allocate(id, type, resource, size, metadata);
  }

  /**
   * 리소스 개수 조회
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 메모리 사용량 정보 조회
   */
  getMemoryUsage(): {
    current: number;
    max: number;
    percentage: number;
    resourceCount: number;
    maxResourceCount: number;
  } {
    return {
      current: this.currentMemoryUsage,
      max: this.options.maxMemoryUsage,
      percentage: Math.round((this.currentMemoryUsage / this.options.maxMemoryUsage) * 100),
      resourceCount: this.resources.size,
      maxResourceCount: this.options.maxResourceCount,
    };
  }

  /**
   * 리소스 정리 (별칭: cleanup - 테스트 호환성)
   */
  cleanup(): void {
    this.performMemoryPressureCleanup();
    this.performInactiveResourceCleanup();
  }

  /**
   * 모든 리소스 해제
   */
  releaseAll(): number {
    const count = this.resources.size;

    for (const item of this.resources.values()) {
      this.cleanupResource(item);
    }

    this.resources.clear();
    this.typeCounters.clear();
    this.currentMemoryUsage = 0;

    logger.debug(`Released all ${count} resources`);
    return count;
  }

  /**
   * 리소스 관리자 정리
   */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.releaseAll();
    OptimizedResourceManager.instance = null;
  }
}

/**
 * 편의 함수: 이미지 리소스 할당
 */
export function allocateImageResource(
  id: string,
  img: HTMLImageElement,
  estimatedSize?: number
): boolean {
  const manager = OptimizedResourceManager.getInstance();
  const size = estimatedSize || img.naturalWidth * img.naturalHeight * 4; // RGBA 추정

  return manager.allocate(id, 'image', img, size, {
    width: img.naturalWidth,
    height: img.naturalHeight,
    src: img.src,
  });
}

/**
 * 편의 함수: Blob URL 리소스 할당
 */
export function allocateBlobResource(id: string, blob: Blob): string | null {
  const manager = OptimizedResourceManager.getInstance();

  try {
    const url = URL.createObjectURL(blob);

    if (
      manager.allocate(id, 'blob', url, blob.size, {
        type: blob.type,
        size: blob.size,
      })
    ) {
      return url;
    }

    URL.revokeObjectURL(url);
    return null;
  } catch (error) {
    logger.warn('Failed to create blob URL:', error);
    return null;
  }
}
