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
 * 리소스 관리자
 */
export class ResourceManager {
  private readonly resources = new Map<
    string,
    { cleanup: () => void; type?: ResourceType | string; context?: string }
  >();

  /**
   * 리소스 등록
   */
  register(
    id: string,
    cleanup: () => void,
    options?: { type?: ResourceType | string; context?: string }
  ): void {
    const entry: { cleanup: () => void; type?: ResourceType | string; context?: string } = {
      cleanup,
    };
    if (options && 'type' in options && options.type !== undefined) {
      entry.type = options.type;
    }
    if (options && 'context' in options && options.context !== undefined) {
      entry.context = options.context;
    }
    this.resources.set(id, entry);
  }

  /**
   * 리소스 해제
   */
  release(id: string): boolean {
    const entry = this.resources.get(id);
    if (entry) {
      try {
        entry.cleanup();
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

    this.resources.forEach((entry, id) => {
      try {
        entry.cleanup();
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

  /**
   * (최소) 타입별 리소스 카운트
   * - 명시적 type 메타가 없으면 id의 접두사(":" 이전)를 타입으로 간주
   */
  getCountsByType(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const [id, entry] of this.resources) {
      const t = entry.type ?? this.deriveTypeFromId(id);
      map[t] = (map[t] ?? 0) + 1;
    }
    return map;
  }

  /**
   * (최소) 컨텍스트별 리소스 카운트
   * - 명시적 context 메타가 없으면 집계하지 않음(안전 기본값)
   */
  getCountsByContext(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const [, entry] of this.resources) {
      if (!entry.context) continue;
      map[entry.context] = (map[entry.context] ?? 0) + 1;
    }
    return map;
  }

  /** 전체 진단 스냅샷 */
  getDiagnostics(): {
    total: number;
    byType: Record<string, number>;
    byContext: Record<string, number>;
  } {
    return {
      total: this.getResourceCount(),
      byType: this.getCountsByType(),
      byContext: this.getCountsByContext(),
    };
  }

  private deriveTypeFromId(id: string): string {
    const idx = id.indexOf(':');
    if (idx > 0) return id.slice(0, idx);
    return 'generic';
  }
}

/**
 * 글로벌 리소스 매니저
 */
export const globalResourceManager = new ResourceManager();

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
