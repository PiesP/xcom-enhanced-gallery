/**
 * @fileoverview 단순화된 리소스 관리 시스템
 * @description 복잡한 클래스 기반 ResourceManager를 단순 함수로 대체
 * @version 2.0.0 - Phase 2 단순화
 */

import { logger } from '@shared/logging';

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
  | 'memory';

/**
 * 리소스 컨텍스트 (그룹화를 위한 식별자)
 */
export type ResourceContext = string;

/**
 * 기본 리소스 엔트리
 */
export interface ResourceEntry {
  id: string;
  type: ResourceType;
  context?: ResourceContext;
  cleanup: () => void;
  metadata?: Record<string, unknown>;
}

// 글로벌 리소스 저장소
const resources = new Map<string, ResourceEntry>();
let resourceIdCounter = 0;

/**
 * 고유 ID 생성
 */
function generateId(type: ResourceType): string {
  return `${type}_${++resourceIdCounter}_${Date.now()}`;
}

/**
 * 타이머 등록 및 관리 (setTimeout)
 */
export function createManagedTimer(callback: () => void, delay: number, context?: string): string {
  const id = generateId('timer');
  const timerId = window.setTimeout(() => {
    callback();
    resources.delete(id);
  }, delay);

  resources.set(id, {
    id,
    type: 'timer',
    ...(context && { context }),
    cleanup: () => window.clearTimeout(timerId),
    metadata: { timerId, delay },
  });

  return id;
}

/**
 * 인터벌 등록 및 관리 (setInterval)
 */
export function createManagedInterval(
  callback: () => void,
  delay: number,
  context?: string
): string {
  const id = generateId('interval');
  const intervalId = window.setInterval(callback, delay);

  resources.set(id, {
    id,
    type: 'interval',
    ...(context && { context }),
    cleanup: () => window.clearInterval(intervalId),
    metadata: { intervalId, delay },
  });

  return id;
}

/**
 * 이벤트 리스너 등록 및 관리
 */
export function addManagedEventListener(
  element: EventTarget,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  context?: string
): string {
  const id = generateId('event');

  element.addEventListener(type, listener, options);

  resources.set(id, {
    id,
    type: 'event',
    ...(context && { context }),
    cleanup: () => element.removeEventListener(type, listener, options),
    metadata: { element, type, listener, options },
  });

  return id;
}

/**
 * MutationObserver 등록 및 관리
 */
export function createManagedObserver(
  callback: MutationCallback,
  target: Node,
  options?: MutationObserverInit,
  context?: string
): string {
  const id = generateId('observer');
  const observer = new MutationObserver(callback);
  observer.observe(target, options);

  resources.set(id, {
    id,
    type: 'observer',
    ...(context && { context }),
    cleanup: () => observer.disconnect(),
    metadata: { observer, target, options },
  });

  return id;
}

/**
 * AbortController 등록 및 관리
 */
export function createManagedController(context?: string): {
  id: string;
  controller: AbortController;
} {
  const id = generateId('controller');
  const controller = new AbortController();

  resources.set(id, {
    id,
    type: 'controller',
    ...(context && { context }),
    cleanup: () => controller.abort(),
    metadata: { controller },
  });

  return { id, controller };
}

/**
 * Object URL 등록 및 관리
 */
export function createManagedObjectURL(blob: Blob, context?: string): { id: string; url: string } {
  const id = generateId('url');
  const url = URL.createObjectURL(blob);

  resources.set(id, {
    id,
    type: 'url',
    ...(context && { context }),
    cleanup: () => URL.revokeObjectURL(url),
    metadata: { url, blob },
  });

  return { id, url };
}

/**
 * 메모리 리소스 등록 및 관리
 */
export function registerManagedMemoryResource(
  resource: unknown,
  cleanupFn: () => void,
  context?: string
): string {
  const id = generateId('memory');

  resources.set(id, {
    id,
    type: 'memory',
    ...(context && { context }),
    cleanup: cleanupFn,
    metadata: { resource },
  });

  return id;
}

/**
 * 특정 리소스 해제
 */
export function releaseResource(id: string): boolean {
  const resource = resources.get(id);
  if (!resource) {
    return false;
  }

  try {
    resource.cleanup();
    resources.delete(id);
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
export function releaseResourcesByContext(context: string): number {
  let released = 0;

  for (const [id, resource] of resources.entries()) {
    if (resource.context === context) {
      if (releaseResource(id)) {
        released++;
      }
    }
  }

  logger.debug(`[ResourceManager] Released ${released} resources for context: ${context}`);
  return released;
}

/**
 * 타입별 리소스 해제
 */
export function releaseResourcesByType(type: ResourceType): number {
  let released = 0;

  for (const [id, resource] of resources.entries()) {
    if (resource.type === type) {
      if (releaseResource(id)) {
        released++;
      }
    }
  }

  logger.debug(`[ResourceManager] Released ${released} resources of type: ${type}`);
  return released;
}

/**
 * 모든 리소스 해제
 */
export function cleanupAllResources(): void {
  const totalResources = resources.size;
  let cleaned = 0;

  for (const [id] of resources.entries()) {
    if (releaseResource(id)) {
      cleaned++;
    }
  }

  logger.debug(
    `[ResourceManager] Cleanup complete: ${cleaned}/${totalResources} resources cleaned`
  );
}

/**
 * 리소스 개수 조회
 */
export function getResourceCount(): number {
  return resources.size;
}

/**
 * 컨텍스트별 리소스 개수 조회
 */
export function getResourceCountByContext(context: string): number {
  let count = 0;
  for (const resource of resources.values()) {
    if (resource.context === context) {
      count++;
    }
  }
  return count;
}

/**
 * 타입별 리소스 개수 조회
 */
export function getResourceCountByType(type: ResourceType): number {
  let count = 0;
  for (const resource of resources.values()) {
    if (resource.type === type) {
      count++;
    }
  }
  return count;
}

/**
 * 리소스 존재 여부 확인
 */
export function hasResource(id: string): boolean {
  return resources.has(id);
}

/**
 * 진단 정보 조회
 */
export function getResourceDiagnostics() {
  const byType: Record<ResourceType, number> = {
    timer: 0,
    interval: 0,
    event: 0,
    observer: 0,
    controller: 0,
    url: 0,
    memory: 0,
  };

  const byContext: Record<string, number> = {};

  for (const resource of resources.values()) {
    byType[resource.type]++;
    if (resource.context) {
      byContext[resource.context] = (byContext[resource.context] || 0) + 1;
    }
  }

  return {
    total: resources.size,
    byType,
    byContext,
  };
}

/**
 * 호환성을 위한 레거시 객체
 * @deprecated Phase 3에서 제거 예정
 */
export const resourceManager = {
  createTimer: createManagedTimer,
  createInterval: createManagedInterval,
  addEventListener: addManagedEventListener,
  createObserver: createManagedObserver,
  createController: createManagedController,
  createObjectURL: createManagedObjectURL,
  registerMemoryResource: registerManagedMemoryResource,
  release: releaseResource,
  releaseByContext: releaseResourcesByContext,
  releaseByType: releaseResourcesByType,
  cleanup: cleanupAllResources,
  getResourceCount,
  getResourceCountByContext,
  getResourceCountByType,
  hasResource,
  getDiagnostics: getResourceDiagnostics,
} as const;

/**
 * 호환성을 위한 레거시 클래스
 * @deprecated Phase 3에서 제거 예정
 */
export class ResourceManager {
  static getInstance() {
    return resourceManager;
  }

  createTimer = createManagedTimer;
  createInterval = createManagedInterval;
  addEventListener = addManagedEventListener;
  createObserver = createManagedObserver;
  createController = createManagedController;
  createObjectURL = createManagedObjectURL;
  registerMemoryResource = registerManagedMemoryResource;
  release = releaseResource;
  releaseByContext = releaseResourcesByContext;
  releaseByType = releaseResourcesByType;
  cleanup = cleanupAllResources;
  getResourceCount = getResourceCount;
  getResourceCountByContext = getResourceCountByContext;
  getResourceCountByType = getResourceCountByType;
  hasResource = hasResource;
  getDiagnostics = getResourceDiagnostics;
}
