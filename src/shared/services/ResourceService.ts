/**
 * @fileoverview 리소스 서비스
 * @description TDD 기반 Manager → Service 네이밍 통일
 * @version 2.0.0
 */

import { logger } from '@shared/logging';

/**
 * 리소스 타입
 */
export type ResourceType = 'image' | 'audio' | 'video' | 'data' | 'cache';

/**
 * 리소스 서비스
 * 애플리케이션 리소스의 생명주기를 관리합니다
 */
export class ResourceService {
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

    for (const [id, cleanup] of this.resources) {
      try {
        cleanup();
      } catch (error) {
        logger.error(`Failed to release resource ${id}:`, error);
        errors.push(error as Error);
      }
    }

    this.resources.clear();

    if (errors.length > 0) {
      logger.warn(`Released all resources with ${errors.length} errors`);
    }
  }

  /**
   * 등록된 리소스 개수
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 리소스가 등록되어 있는지 확인
   */
  has(id: string): boolean {
    return this.resources.has(id);
  }

  /**
   * 등록된 모든 리소스 ID 목록
   */
  getAllResourceIds(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * 리소스 서비스 상태 정보
   */
  getStatus(): {
    totalResources: number;
    resourceIds: string[];
  } {
    return {
      totalResources: this.resources.size,
      resourceIds: this.getAllResourceIds(),
    };
  }
}
