/**
 * @fileoverview Core Memory Manager - TDD Phase 2
 * @description 중복된 ResourceManager들을 통합한 Core 모듈
 * @version 1.0.0 - Phase 2: Memory Management Consolidation
 */

import { coreLogger as logger } from '../logger';

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
  id: string;
  type: ResourceType;
  context?: string;
  cleanup: () => void;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/**
 * 메모리 사용량 정보
 */
export interface MemoryUsage {
  heap: number;
  external: number;
  timestamp: number;
}

/**
 * Core Memory Manager - 싱글톤 패턴
 *
 * 기존의 중복된 ResourceManager들을 통합:
 * - src/shared/utils/memory/ResourceManager.ts
 * - src/shared/utils/resource-manager.ts
 */
export class CoreMemoryManager {
  private static instance: CoreMemoryManager | null = null;
  private readonly resources = new Map<string, ResourceEntry>();
  private resourceIdCounter = 0;

  private constructor() {
    logger.debug('[CoreMemoryManager] 초기화 완료');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  static getInstance(): CoreMemoryManager {
    if (!CoreMemoryManager.instance) {
      CoreMemoryManager.instance = new CoreMemoryManager();
    }
    return CoreMemoryManager.instance;
  }

  /**
   * 고유 ID 생성
   */
  private generateId(type: ResourceType): string {
    return `${type}_${++this.resourceIdCounter}_${Date.now()}`;
  }

  /**
   * 리소스 등록
   */
  register(
    type: ResourceType,
    cleanup: () => void,
    context?: string,
    metadata?: Record<string, unknown>
  ): string {
    const id = this.generateId(type);
    const entry: ResourceEntry = {
      id,
      type,
      ...(context && { context }),
      cleanup,
      ...(metadata && { metadata }),
      timestamp: Date.now(),
    };

    this.resources.set(id, entry);
    logger.debug(`[CoreMemoryManager] 리소스 등록: ${id} (${type})`);

    return id;
  }

  /**
   * 리소스 해제
   */
  release(id: string): boolean {
    const entry = this.resources.get(id);
    if (!entry) {
      return false;
    }

    try {
      entry.cleanup();
      this.resources.delete(id);
      logger.debug(`[CoreMemoryManager] 리소스 해제: ${id}`);
      return true;
    } catch (error) {
      logger.error(`[CoreMemoryManager] 리소스 해제 실패: ${id}`, error);
      return false;
    }
  }

  /**
   * 컨텍스트별 리소스 해제
   */
  releaseByContext(context: string): number {
    let released = 0;

    for (const [id, entry] of this.resources.entries()) {
      if (entry.context === context) {
        if (this.release(id)) {
          released++;
        }
      }
    }

    logger.debug(`[CoreMemoryManager] 컨텍스트 해제: ${context} (${released}개)`);
    return released;
  }

  /**
   * 타입별 리소스 해제
   */
  releaseByType(type: ResourceType): number {
    let released = 0;

    for (const [id, entry] of this.resources.entries()) {
      if (entry.type === type) {
        if (this.release(id)) {
          released++;
        }
      }
    }

    logger.debug(`[CoreMemoryManager] 타입별 해제: ${type} (${released}개)`);
    return released;
  }

  /**
   * 모든 리소스 해제
   */
  cleanupResources(): { cleaned: number; total: number } {
    const total = this.resources.size;
    let cleaned = 0;

    for (const [id] of this.resources.entries()) {
      if (this.release(id)) {
        cleaned++;
      }
    }

    logger.debug(`[CoreMemoryManager] 전체 정리: ${cleaned}/${total}`);
    return { cleaned, total };
  }

  /**
   * 메모리 사용량 추적
   */
  trackMemoryUsage(): MemoryUsage {
    // 브라우저 환경에서의 메모리 정보
    const memory = (
      performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }
    ).memory;

    return {
      heap: memory?.usedJSHeapSize || 0,
      external: memory?.totalJSHeapSize || 0,
      timestamp: Date.now(),
    };
  }

  /**
   * 리소스 현황 조회
   */
  getResourceInfo(): {
    total: number;
    byType: Record<ResourceType, number>;
    byContext: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    const byContext: Record<string, number> = {};

    for (const entry of this.resources.values()) {
      // 타입별 카운트
      byType[entry.type] = (byType[entry.type] || 0) + 1;

      // 컨텍스트별 카운트
      if (entry.context) {
        byContext[entry.context] = (byContext[entry.context] || 0) + 1;
      }
    }

    return {
      total: this.resources.size,
      byType: byType as Record<ResourceType, number>,
      byContext,
    };
  }

  /**
   * 오래된 리소스 정리 (1시간 이상)
   */
  cleanupOldResources(maxAge: number = 3600000): number {
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [id, entry] of this.resources.entries()) {
      if (entry.timestamp < cutoff) {
        if (this.release(id)) {
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      logger.debug(`[CoreMemoryManager] 오래된 리소스 정리: ${cleaned}개`);
    }

    return cleaned;
  }
}

// 싱글톤 인스턴스 getter
const getCoreMemoryManager = (): CoreMemoryManager => CoreMemoryManager.getInstance();

// 편의 함수들 - 기존 API 호환성 유지
export function trackMemoryUsage(): MemoryUsage {
  return getCoreMemoryManager().trackMemoryUsage();
}

export function cleanupResources(): { cleaned: number; total: number } {
  return getCoreMemoryManager().cleanupResources();
}

export function registerResource(
  type: ResourceType,
  cleanup: () => void,
  context?: string,
  metadata?: Record<string, unknown>
): string {
  return getCoreMemoryManager().register(type, cleanup, context, metadata);
}

export function releaseResource(id: string): boolean {
  return getCoreMemoryManager().release(id);
}

export function releaseResourcesByContext(context: string): number {
  return getCoreMemoryManager().releaseByContext(context);
}

export function releaseResourcesByType(type: ResourceType): number {
  return getCoreMemoryManager().releaseByType(type);
}

export function getMemoryInfo(): {
  total: number;
  byType: Record<ResourceType, number>;
  byContext: Record<string, number>;
} {
  return getCoreMemoryManager().getResourceInfo();
}

export { getCoreMemoryManager };
