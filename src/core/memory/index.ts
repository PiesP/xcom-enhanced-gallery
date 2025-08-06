/**
 * @fileoverview Core Memory Manager - 아키텍처 규칙 준수
 * @description Core 계층 전용 메모리 관리자 (shared 의존성 제거)
 * @version 3.0.0 - 아키텍처 규칙 준수
 */

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
 * Core 계층 전용 메모리 관리자
 */
class CoreMemoryManager {
  private static instance: CoreMemoryManager | null = null;
  private readonly resources = new Map<string, ResourceEntry>();

  public static getInstance(): CoreMemoryManager {
    if (!CoreMemoryManager.instance) {
      CoreMemoryManager.instance = new CoreMemoryManager();
    }
    return CoreMemoryManager.instance;
  }

  /**
   * 리소스 등록
   */
  register(id: string, type: ResourceType, cleanup: () => void, context?: string): void {
    const entry: ResourceEntry = {
      id,
      type,
      cleanup,
      timestamp: Date.now(),
      ...(context !== undefined && { context }),
    };
    this.resources.set(id, entry);
  }

  /**
   * 리소스 해제
   */
  unregister(id: string): boolean {
    const resource = this.resources.get(id);
    if (resource) {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn(`리소스 정리 실패: ${id}`, error);
      }
      return this.resources.delete(id);
    }
    return false;
  }

  /**
   * 모든 리소스 정리
   */
  cleanup(): void {
    for (const [id, resource] of this.resources) {
      try {
        resource.cleanup();
      } catch (error) {
        console.warn(`리소스 정리 실패: ${id}`, error);
      }
    }
    this.resources.clear();
  }

  /**
   * 등록된 리소스 수
   */
  getResourceCount(): number {
    return this.resources.size;
  }
}

// 인스턴스 export
export const coreMemoryManager = CoreMemoryManager.getInstance();
export { CoreMemoryManager };
