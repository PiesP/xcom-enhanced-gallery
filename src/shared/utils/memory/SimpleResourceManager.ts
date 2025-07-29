/**
 * @fileoverview 간단한 리소스 관리 유틸리티
 * @description 유저스크립트에 적합한 기본적인 리소스 관리
 * @version 1.0.0 - Phase C2: 단순화
 */

import { logger } from '@shared/logging/logger';

/**
 * 리소스 타입
 */
export type ResourceType = 'image' | 'audio' | 'video' | 'data' | 'cache';

/**
 * 간단한 리소스 관리자
 */
export class SimpleResourceManager {
  private readonly resources = new Map<string, () => void>();

  /**
   * 리소스 등록
   */
  register(id: string, cleanup: () => void): void {
    this.resources.set(id, cleanup);
  }

  /**
   * 리소스 해제
   */
  release(id: string): boolean {
    const cleanup = this.resources.get(id);
    if (cleanup) {
      try {
        cleanup();
        this.resources.delete(id);
        return true;
      } catch (error) {
        logger.error(`Failed to release resource ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * 모든 리소스 해제
   */
  releaseAll(): void {
    const errors: Error[] = [];

    this.resources.forEach((cleanup, id) => {
      try {
        cleanup();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
        logger.error(`Failed to release resource ${id}:`, error);
      }
    });

    this.resources.clear();

    if (errors.length > 0) {
      logger.warn(`Failed to release ${errors.length} resources`);
    }
  }

  /**
   * 등록된 리소스 수
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 리소스가 등록되어 있는지 확인
   */
  hasResource(id: string): boolean {
    return this.resources.has(id);
  }
}

/**
 * 글로벌 리소스 매니저
 */
export const globalResourceManager = new SimpleResourceManager();

/**
 * 편의 함수: 리소스 등록
 */
export function registerResource(id: string, cleanup: () => void): void {
  globalResourceManager.register(id, cleanup);
}

/**
 * 편의 함수: 리소스 해제
 */
export function releaseResource(id: string): boolean {
  return globalResourceManager.release(id);
}

/**
 * 편의 함수: 모든 리소스 해제
 */
export function releaseAllResources(): void {
  globalResourceManager.releaseAll();
}

// 하위 호환성을 위한 별칭
export { SimpleResourceManager as MemoryPoolManager };
export { globalResourceManager as memoryPoolManager };
