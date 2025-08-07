/**
 * @fileoverview 통합된 메모리 관리자 - TDD GREEN Phase
 * @description CoreMemoryManager와 MemoryTracker를 통합한 단일 메모리 관리자
 * @version 1.0.0 - Priority 1 통합 완료
 */

import { createScopedLogger } from '@shared/logging';

const logger = createScopedLogger('UnifiedMemoryManager');

/**
 * 리소스 타입 정의
 */
export type ResourceType =
  | 'timer'
  | 'interval'
  | 'event'
  | 'observer'
  | 'controller'
  | 'url'
  | 'memory'
  | 'image'
  | 'audio'
  | 'video'
  | 'data'
  | 'cache';

/**
 * 리소스 엔트리 인터페이스
 */
export interface ResourceEntry {
  readonly id: string;
  readonly type: ResourceType;
  readonly context?: string;
  readonly cleanup: () => void;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: number;
}

/**
 * 메모리 사용량 정보
 */
export interface MemoryUsage {
  readonly heap: number;
  readonly external: number;
  readonly timestamp: number;
}

/**
 * 메모리 상태 정보
 */
export interface MemoryStatus {
  readonly totalResources: number;
  readonly resourcesByType: Record<ResourceType, number>;
  readonly memoryUsageMB: number | null;
  readonly status: 'normal' | 'warning' | 'critical' | 'unknown';
  readonly oldestResource?: {
    readonly id: string;
    readonly age: number;
  };
}

/**
 * 메모리 임계값
 */
export const MEMORY_THRESHOLDS = {
  WARNING_MB: 50,
  CRITICAL_MB: 100,
  GC_TRIGGER_MB: 80,
} as const;

/**
 * 통합된 메모리 관리자 클래스
 *
 * CoreMemoryManager + MemoryTracker 기능을 통합:
 * - 리소스 등록/해제 관리
 * - 메모리 사용량 추적
 * - 메모리 누수 감지
 * - 자동 정리 기능
 */
export class UnifiedMemoryManager {
  private static instance: UnifiedMemoryManager | null = null;
  private readonly resources = new Map<string, ResourceEntry>();
  private readonly memoryTracking = new Map<string, number>();
  private readonly registrationHistory = new Set<string>();

  private constructor() {
    logger.debug('통합 메모리 관리자 초기화');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): UnifiedMemoryManager {
    if (!UnifiedMemoryManager.instance) {
      UnifiedMemoryManager.instance = new UnifiedMemoryManager();
    }
    return UnifiedMemoryManager.instance;
  }

  /**
   * 메모리 관리자 초기화
   */
  public initialize(): void {
    logger.debug('메모리 관리자 초기화 완료');
    // 기본적으로 이미 생성자에서 초기화되므로 추가 작업 없음
  }

  /**
   * 리소스 등록 (CoreMemoryManager 기능)
   */
  public register(
    id: string,
    type: ResourceType,
    cleanup: () => void,
    options?: {
      context?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    // 중복 등록 방지
    if (this.registrationHistory.has(id)) {
      logger.debug(`리소스 이미 등록됨: ${id}`);
      return;
    }

    const entry: ResourceEntry = {
      id,
      type,
      cleanup,
      timestamp: Date.now(),
      ...(options?.context && { context: options.context }),
      ...(options?.metadata && { metadata: options.metadata }),
    };

    this.resources.set(id, entry);
    this.registrationHistory.add(id);

    logger.debug(`리소스 등록: ${id} (${type})`);
  }

  /**
   * 특정 리소스 해제
   */
  public release(id: string): boolean {
    const entry = this.resources.get(id);
    if (!entry) {
      return false;
    }

    try {
      entry.cleanup();
      this.resources.delete(id);
      logger.debug(`리소스 해제: ${id}`);
      return true;
    } catch (error) {
      logger.warn(`리소스 해제 실패: ${id}`, error);
      return false;
    }
  }

  /**
   * 타입별 리소스 해제
   */
  public releaseByType(type: ResourceType): number {
    let releasedCount = 0;

    for (const [id, entry] of this.resources.entries()) {
      if (entry.type === type) {
        if (this.release(id)) {
          releasedCount++;
        }
      }
    }

    logger.debug(`타입별 리소스 해제: ${type} (${releasedCount}개)`);
    return releasedCount;
  }

  /**
   * 메모리 정보 반환 (MemoryTracker 기능)
   */
  public getMemoryInfo(): MemoryUsage | null {
    // Chrome의 performance.memory API 사용 (실험적 기능)
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };

    if (typeof performance === 'undefined' || !perfWithMemory.memory) {
      return null;
    }

    return {
      heap: perfWithMemory.memory.usedJSHeapSize,
      external: perfWithMemory.memory.totalJSHeapSize - perfWithMemory.memory.usedJSHeapSize,
      timestamp: Date.now(),
    };
  }

  /**
   * 메모리 사용량 MB 단위로 반환
   */
  public getMemoryUsageMB(): number | null {
    const memoryInfo = this.getMemoryInfo();
    if (!memoryInfo) return null;

    return Math.round((memoryInfo.heap / 1024 / 1024) * 100) / 100;
  }

  /**
   * 메모리 상태 반환
   */
  public getMemoryStatus(): 'normal' | 'warning' | 'critical' | 'unknown' {
    const usageMB = this.getMemoryUsageMB();
    if (usageMB === null) return 'unknown';

    if (usageMB >= MEMORY_THRESHOLDS.CRITICAL_MB) return 'critical';
    if (usageMB >= MEMORY_THRESHOLDS.WARNING_MB) return 'warning';
    return 'normal';
  }

  /**
   * 메모리 추적 등록
   */
  public trackMemory(target: string, size: number): void {
    const currentSize = this.memoryTracking.get(target) || 0;
    this.memoryTracking.set(target, currentSize + size);

    // 메모리 임계값 확인
    const totalMB = this.getMemoryUsageMB();
    if (totalMB && totalMB >= MEMORY_THRESHOLDS.GC_TRIGGER_MB) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * 가비지 컬렉션 트리거 시도
   */
  public triggerGarbageCollection(): boolean {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as unknown as { gc: () => void }).gc();
        logger.debug('가비지 컬렉션 실행됨');
        return true;
      } catch (error) {
        logger.debug('가비지 컬렉션 실행 실패:', error);
      }
    }
    return false;
  }

  /**
   * 전체 정리
   */
  public cleanup(): void {
    logger.info(`전체 리소스 정리 시작: ${this.resources.size}개`);

    let successCount = 0;
    let failCount = 0;

    for (const [id, entry] of this.resources.entries()) {
      try {
        entry.cleanup();
        successCount++;
      } catch (error) {
        logger.warn(`리소스 정리 실패: ${id}`, error);
        failCount++;
      }
    }

    this.resources.clear();
    this.memoryTracking.clear();
    this.registrationHistory.clear();

    logger.info(`리소스 정리 완료: 성공 ${successCount}개, 실패 ${failCount}개`);
  }

  /**
   * 진단 정보 반환
   */
  public getDiagnostics(): MemoryStatus {
    const resourcesByType: Record<ResourceType, number> = {
      timer: 0,
      interval: 0,
      event: 0,
      observer: 0,
      controller: 0,
      url: 0,
      memory: 0,
      image: 0,
      audio: 0,
      video: 0,
      data: 0,
      cache: 0,
    };

    let oldestResource: { id: string; age: number } | undefined;
    const now = Date.now();

    for (const [id, entry] of this.resources.entries()) {
      resourcesByType[entry.type]++;

      const age = now - entry.timestamp;
      if (!oldestResource || age > oldestResource.age) {
        oldestResource = { id, age };
      }
    }

    return {
      totalResources: this.resources.size,
      resourcesByType,
      memoryUsageMB: this.getMemoryUsageMB(),
      status: this.getMemoryStatus(),
      ...(oldestResource && { oldestResource }),
    };
  }

  /**
   * 테스트용 인스턴스 재설정
   */
  public static resetInstance(): void {
    if (UnifiedMemoryManager.instance) {
      UnifiedMemoryManager.instance.cleanup();
      UnifiedMemoryManager.instance = null;
    }
  }
}

// 기존 API 호환성을 위한 별명 export
export { UnifiedMemoryManager as CoreMemoryManager };
export { UnifiedMemoryManager as MemoryTracker };

// 기본 인스턴스 export
export const memoryManager = UnifiedMemoryManager.getInstance();
