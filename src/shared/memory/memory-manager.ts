/**
 * 통합된 메모리 관리자
 *
 * MemoryTracker와 ResourceManager의 중복 기능을 통합하여
 * 일관된 메모리 관리 인터페이스를 제공합니다.
 */

import { createScopedLogger } from '@shared/logging/logger';
import type { ResourceType } from '@core/types/index';

const logger = createScopedLogger('UnifiedMemoryManager');

interface ResourceEntry {
  id: string;
  type: ResourceType;
  cleanup: () => void;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

interface MemoryStatus {
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  oldestResource?:
    | {
        id: string;
        age: number;
      }
    | undefined;
}

class UnifiedMemoryManager {
  private readonly resources = new Map<string, ResourceEntry>();
  private readonly cleanupCallbacks = new Set<() => void>();

  /**
   * 리소스 등록
   */
  registerResource(
    id: string,
    type: ResourceType,
    cleanup: () => void,
    metadata?: Record<string, unknown>
  ): void {
    const entry: ResourceEntry = {
      id,
      type,
      cleanup,
      ...(metadata && { metadata }),
      timestamp: Date.now(),
    };

    this.resources.set(id, entry);
    logger.debug(`Resource registered: ${id} (${type})`);
  }

  /**
   * 특정 리소스 해제
   */
  releaseResource(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) {
      logger.warn(`Resource not found: ${id}`);
      return false;
    }

    try {
      resource.cleanup();
      this.resources.delete(id);
      logger.debug(`Resource released: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to release resource ${id}:`, error);
      return false;
    }
  }

  /**
   * 모든 리소스 정리
   */
  cleanupResources(type?: ResourceType): void {
    const resourcesToCleanup = type
      ? Array.from(this.resources.values()).filter(r => r.type === type)
      : Array.from(this.resources.values());

    logger.info(
      `Cleaning up ${resourcesToCleanup.length} resources${type ? ` of type ${type}` : ''}`
    );

    for (const resource of resourcesToCleanup) {
      try {
        resource.cleanup();
        this.resources.delete(resource.id);
      } catch (error) {
        logger.error(`Failed to cleanup resource ${resource.id}:`, error);
      }
    }

    // 전역 정리 콜백 실행
    if (!type) {
      this.runGlobalCleanup();
    }
  }

  /**
   * 메모리 상태 조회
   */
  getMemoryStatus(): MemoryStatus {
    const resourcesByType: Record<ResourceType, number> = {
      image: 0,
      video: 0,
      element: 0,
      observer: 0,
      listener: 0,
      component: 0,
      dom: 0,
      event: 0,
      style: 0,
      media: 0,
      network: 0,
      cache: 0,
      worker: 0,
    };

    let oldestResource: { id: string; age: number } | undefined;
    let oldestTimestamp = Date.now();

    for (const resource of this.resources.values()) {
      if (resourcesByType[resource.type] !== undefined) {
        resourcesByType[resource.type]++;
      }

      if (resource.timestamp < oldestTimestamp) {
        oldestTimestamp = resource.timestamp;
        oldestResource = {
          id: resource.id,
          age: Date.now() - resource.timestamp,
        };
      }
    }

    return {
      totalResources: this.resources.size,
      resourcesByType,
      oldestResource: oldestResource || undefined,
    };
  }

  /**
   * 전역 정리 콜백 등록
   */
  addGlobalCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * 전역 정리 콜백 제거
   */
  removeGlobalCleanupCallback(callback: () => void): void {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * 전역 정리 콜백 실행
   */
  private runGlobalCleanup(): void {
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        logger.error('Global cleanup callback failed:', error);
      }
    }
  }

  /**
   * 리소스 존재 여부 확인
   */
  hasResource(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * 타입별 리소스 개수 조회
   */
  getResourceCount(type?: ResourceType): number {
    if (!type) {
      return this.resources.size;
    }

    return Array.from(this.resources.values()).filter(r => r.type === type).length;
  }

  /**
   * 오래된 리소스 정리 (메모리 압박 상황에서 사용)
   */
  cleanupOldResources(maxAge: number): void {
    const now = Date.now();
    const oldResources = Array.from(this.resources.values()).filter(
      r => now - r.timestamp > maxAge
    );

    logger.info(`Cleaning up ${oldResources.length} old resources (older than ${maxAge}ms)`);

    for (const resource of oldResources) {
      this.releaseResource(resource.id);
    }
  }
}

// 싱글톤 인스턴스
const unifiedMemoryManager = new UnifiedMemoryManager();

// 내보내기
export const registerResource = unifiedMemoryManager.registerResource.bind(unifiedMemoryManager);
export const releaseResource = unifiedMemoryManager.releaseResource.bind(unifiedMemoryManager);
export const getMemoryStatus = unifiedMemoryManager.getMemoryStatus.bind(unifiedMemoryManager);
export const cleanupResources = unifiedMemoryManager.cleanupResources.bind(unifiedMemoryManager);

export const addGlobalCleanupCallback =
  unifiedMemoryManager.addGlobalCleanupCallback.bind(unifiedMemoryManager);

export const removeGlobalCleanupCallback =
  unifiedMemoryManager.removeGlobalCleanupCallback.bind(unifiedMemoryManager);

export const hasResource = unifiedMemoryManager.hasResource.bind(unifiedMemoryManager);
export const getResourceCount = unifiedMemoryManager.getResourceCount.bind(unifiedMemoryManager);

export const cleanupOldResources =
  unifiedMemoryManager.cleanupOldResources.bind(unifiedMemoryManager);

export { UnifiedMemoryManager };
export type { ResourceEntry, MemoryStatus };
