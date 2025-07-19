/**
 * @fileoverview 통합 리소스 매니저
 * @version 2.0.0 - 분산된 매니저들 통합
 * @description 타이머, 이벤트, 메모리, URL 등 모든 리소스를 통합 관리
 */

import { logger } from '@infrastructure/logging/logger';
import type { Cleanupable } from '../types/lifecycle.types';

interface ManagedResource {
  id: string;
  type: 'timer' | 'interval' | 'event' | 'observer' | 'controller' | 'url' | 'memory';
  resource: unknown;
  context?: string | undefined;
  cleanup: () => void;
}

export class ResourceManager implements Cleanupable {
  private static instance: ResourceManager | null = null;
  private readonly resources = new Map<string, ManagedResource>();
  private resourceIdCounter = 0;

  private constructor() {}

  public static getInstance(): ResourceManager {
    ResourceManager.instance ??= new ResourceManager();
    return ResourceManager.instance;
  }

  /**
   * 타이머 등록 및 관리 (setTimeout)
   */
  public createTimer(callback: () => void, delay: number, context?: string): string {
    const id = this.generateId('timer');
    const timerId = window.setTimeout(() => {
      callback();
      this.resources.delete(id);
    }, delay);

    this.resources.set(id, {
      id,
      type: 'timer',
      resource: timerId,
      context,
      cleanup: () => window.clearTimeout(timerId),
    });

    return id;
  }

  /**
   * 인터벌 등록 및 관리 (setInterval)
   */
  public createInterval(callback: () => void, delay: number, context?: string): string {
    const id = this.generateId('interval');
    const intervalId = window.setInterval(callback, delay);

    this.resources.set(id, {
      id,
      type: 'interval',
      resource: intervalId,
      context,
      cleanup: () => window.clearInterval(intervalId),
    });

    return id;
  }

  /**
   * 이벤트 리스너 등록 및 관리
   */
  public addEventListener(
    element: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
    context?: string
  ): string {
    const id = this.generateId('event');

    element.addEventListener(type, listener, options);

    this.resources.set(id, {
      id,
      type: 'event',
      resource: { element, type, listener, options },
      context,
      cleanup: () => element.removeEventListener(type, listener, options),
    });

    return id;
  }

  /**
   * MutationObserver 등록 및 관리
   */
  public createObserver(
    callback: MutationCallback,
    target: Node,
    options?: MutationObserverInit,
    context?: string
  ): string {
    const id = this.generateId('observer');
    const observer = new MutationObserver(callback);
    observer.observe(target, options);

    this.resources.set(id, {
      id,
      type: 'observer',
      resource: observer,
      context,
      cleanup: () => observer.disconnect(),
    });

    return id;
  }

  /**
   * AbortController 등록 및 관리
   */
  public createController(context?: string): { id: string; controller: AbortController } {
    const id = this.generateId('controller');
    const controller = new AbortController();

    this.resources.set(id, {
      id,
      type: 'controller',
      resource: controller,
      context,
      cleanup: () => controller.abort(),
    });

    return { id, controller };
  }

  /**
   * URL 객체 등록 및 관리
   */
  public createObjectURL(blob: Blob, context?: string): { id: string; url: string } {
    const id = this.generateId('url');
    const url = URL.createObjectURL(blob);

    this.resources.set(id, {
      id,
      type: 'url',
      resource: url,
      context,
      cleanup: () => URL.revokeObjectURL(url),
    });

    return { id, url };
  }

  /**
   * 메모리 리소스 등록 및 관리
   */
  public registerMemoryResource(
    resource: unknown,
    cleanupFn: () => void,
    context?: string
  ): string {
    const id = this.generateId('memory');

    this.resources.set(id, {
      id,
      type: 'memory',
      resource,
      context,
      cleanup: cleanupFn,
    });

    return id;
  }

  /**
   * 특정 리소스 해제
   */
  public release(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) {
      return false;
    }

    try {
      resource.cleanup();
      this.resources.delete(id);
      logger.debug(`[ResourceManager] Released resource: ${id}`);
      return true;
    } catch (error) {
      logger.error(`[ResourceManager] Failed to release resource: ${id}`, error);
      return false;
    }
  }

  /**
   * 컨텍스트별 리소스 해제
   */
  public releaseByContext(context: string): number {
    let released = 0;
    const toRelease: string[] = [];

    for (const [id, resource] of this.resources.entries()) {
      if (resource.context === context) {
        toRelease.push(id);
      }
    }

    for (const id of toRelease) {
      if (this.release(id)) {
        released++;
      }
    }

    logger.debug(`[ResourceManager] Released ${released} resources for context: ${context}`);
    return released;
  }

  /**
   * 타입별 리소스 해제
   */
  public releaseByType(type: ManagedResource['type']): number {
    let released = 0;
    const toRelease: string[] = [];

    for (const [id, resource] of this.resources.entries()) {
      if (resource.type === type) {
        toRelease.push(id);
      }
    }

    for (const id of toRelease) {
      if (this.release(id)) {
        released++;
      }
    }

    logger.debug(`[ResourceManager] Released ${released} resources of type: ${type}`);
    return released;
  }

  /**
   * 모든 리소스 정리
   */
  public cleanup(): void {
    const totalResources = this.resources.size;
    let cleaned = 0;

    const toClean = Array.from(this.resources.keys());
    for (const id of toClean) {
      if (this.release(id)) {
        cleaned++;
      }
    }

    logger.info(
      `[ResourceManager] Cleanup complete: ${cleaned}/${totalResources} resources cleaned`
    );
  }

  /**
   * 디버그 정보 조회
   */
  public getDebugInfo(): {
    totalResources: number;
    byType: Record<string, number>;
    byContext: Record<string, number>;
    resources: Array<{ id: string; type: string; context?: string }>;
  } {
    const byType: Record<string, number> = {};
    const byContext: Record<string, number> = {};
    const resources: Array<{ id: string; type: string; context?: string }> = [];

    for (const [id, resource] of this.resources.entries()) {
      byType[resource.type] = (byType[resource.type] || 0) + 1;
      if (resource.context) {
        byContext[resource.context] = (byContext[resource.context] || 0) + 1;
      }
      resources.push({
        id,
        type: resource.type,
        ...(resource.context && { context: resource.context }),
      });
    }

    return {
      totalResources: this.resources.size,
      byType,
      byContext,
      resources,
    };
  }

  /**
   * 메모리 사용량 조회
   */
  public getMemoryUsage(): {
    totalResources: number;
    estimatedMemoryKB: number;
  } {
    // 간단한 메모리 사용량 추정
    const totalResources = this.resources.size;
    const estimatedMemoryKB = totalResources * 0.1; // 리소스당 약 100바이트 추정

    return {
      totalResources,
      estimatedMemoryKB,
    };
  }

  /**
   * 현재 관리 중인 리소스 수 조회
   */
  public getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 유니크 ID 생성 - crypto.randomUUID() 사용으로 충돌 방지 강화
   */
  private generateId(type: string): string {
    try {
      // crypto.randomUUID() 사용 (Node.js 16+, 모던 브라우저)
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${type}_${crypto.randomUUID()}`;
      }
    } catch {
      // crypto.randomUUID() 실패 시 폴백
    }

    // 폴백: 강화된 랜덤 생성
    const counter = ++this.resourceIdCounter;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const randomId = Math.random().toString(36).substring(2, 15);

    return `${type}_${counter}_${timestamp}_${random}_${randomId}`;
  }

  /**
   * 테스트용 인스턴스 리셋
   */
  public static resetInstance(): void {
    if (ResourceManager.instance) {
      ResourceManager.instance.cleanup();
      ResourceManager.instance = null;
    }
  }
}

// 싱글톤 인스턴스 export
export const resourceManager = ResourceManager.getInstance();

// 편의 함수들
export function createManagedTimer(callback: () => void, delay: number, context?: string): string {
  return resourceManager.createTimer(callback, delay, context);
}

export function createManagedInterval(
  callback: () => void,
  delay: number,
  context?: string
): string {
  return resourceManager.createInterval(callback, delay, context);
}

export function addManagedEventListener(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  return resourceManager.addEventListener(element, type, listener, options, context);
}

export function createManagedObserver(
  callback: MutationCallback,
  target: Node,
  options?: MutationObserverInit,
  context?: string
): string {
  return resourceManager.createObserver(callback, target, options, context);
}

export function createManagedController(context?: string): {
  id: string;
  controller: AbortController;
} {
  return resourceManager.createController(context);
}

export function createManagedObjectURL(blob: Blob, context?: string): { id: string; url: string } {
  return resourceManager.createObjectURL(blob, context);
}

export function registerManagedMemoryResource(
  resource: unknown,
  cleanupFn: () => void,
  context?: string
): string {
  return resourceManager.registerMemoryResource(resource, cleanupFn, context);
}

export function releaseResource(id: string): boolean {
  return resourceManager.release(id);
}

export function releaseResourcesByContext(context: string): number {
  return resourceManager.releaseByContext(context);
}

export function cleanupAllResources(): void {
  resourceManager.cleanup();
}
