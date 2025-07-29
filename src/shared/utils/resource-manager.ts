/**
 * @fileoverview ?¨ìˆœ?”ëœ ë¦¬ì†Œ??ê´€ë¦??œìŠ¤?? * @description ë³µì¡???´ë˜??ê¸°ë°˜ ResourceManagerë¥??¨ìˆœ ?¨ìˆ˜ë¡??€ì²? * @version 2.0.0 - Phase 2 ?¨ìˆœ?? */

import { logger } from '@shared/logging';

/**
 * ë¦¬ì†Œ???€???•ì˜
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
 * ë¦¬ì†Œ??ì»¨í…?¤íŠ¸ (ê·¸ë£¹?”ë? ?„í•œ ?ë³„??
 */
export type ResourceContext = string;

/**
 * ê¸°ë³¸ ë¦¬ì†Œ???”íŠ¸ë¦? */
export interface ResourceEntry {
  id: string;
  type: ResourceType;
  context?: ResourceContext;
  cleanup: () => void;
  metadata?: Record<string, unknown>;
}

// ê¸€ë¡œë²Œ ë¦¬ì†Œ???€?¥ì†Œ
const resources = new Map<string, ResourceEntry>();
let resourceIdCounter = 0;

/**
 * ê³ ìœ  ID ?ì„±
 */
function generateId(type: ResourceType): string {
  return `${type}_${++resourceIdCounter}_${Date.now()}`;
}

/**
 * ?€?´ë¨¸ ?±ë¡ ë°?ê´€ë¦?(setTimeout)
 */
export function createTimer(callback: () => void, delay: number, context?: string): string {
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
 * ?¸í„°ë²??±ë¡ ë°?ê´€ë¦?(setInterval)
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
 * ?´ë²¤??ë¦¬ìŠ¤???±ë¡ ë°?ê´€ë¦? */
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
 * MutationObserver ?±ë¡ ë°?ê´€ë¦? */
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
 * AbortController ?±ë¡ ë°?ê´€ë¦? */
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
 * Object URL ?±ë¡ ë°?ê´€ë¦? */
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
 * ë©”ëª¨ë¦?ë¦¬ì†Œ???±ë¡ ë°?ê´€ë¦? */
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
 * ?¹ì • ë¦¬ì†Œ???´ì œ
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
 * ì»¨í…?¤íŠ¸ë³?ë¦¬ì†Œ???´ì œ
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
 * ?€?…ë³„ ë¦¬ì†Œ???´ì œ
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
 * ëª¨ë“  ë¦¬ì†Œ???´ì œ
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
 * ë¦¬ì†Œ??ê°œìˆ˜ ì¡°íšŒ
 */
export function getResourceCount(): number {
  return resources.size;
}

/**
 * ì»¨í…?¤íŠ¸ë³?ë¦¬ì†Œ??ê°œìˆ˜ ì¡°íšŒ
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
 * ?€?…ë³„ ë¦¬ì†Œ??ê°œìˆ˜ ì¡°íšŒ
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
 * ë¦¬ì†Œ??ì¡´ì¬ ?¬ë? ?•ì¸
 */
export function hasResource(id: string): boolean {
  return resources.has(id);
}

/**
 * ì§„ë‹¨ ?•ë³´ ì¡°íšŒ
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
 * ?¸í™˜?±ì„ ?„í•œ ?ˆê±°??ê°ì²´
 * @deprecated Phase 3?ì„œ ?œê±° ?ˆì •
 */
export const resourceManager = {
  createTimer: createTimer,
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
 * ?¸í™˜?±ì„ ?„í•œ ?ˆê±°???´ë˜?? * @deprecated Phase 3?ì„œ ?œê±° ?ˆì •
 */
export class ResourceManager {
  static getInstance() {
    return resourceManager;
  }

  createTimer = createTimer;
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
