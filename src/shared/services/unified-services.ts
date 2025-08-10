/**
 * @fileoverview 통합 서비스 클래스 모듈
 * @description 중복된 서비스 구현들을 하나의 위치에서 통합 관리
 * @version 1.0.0 - 서비스 통합 완료
 */

import { logger } from '@shared/logging';

// ========================================
// UNIFIED TIMER SERVICE
// ========================================

/**
 * Timer Handle 인터페이스 - 통합된 버전
 */
export interface UnifiedTimerHandle {
  id: string;
  cancel: () => void;
}

/**
 * 통합 Timer Service 인터페이스
 * 모든 기존 TimerService 구현들의 기능을 포함
 */
export interface IUnifiedTimerService {
  // Key-based API (Services TimerService 호환)
  setTimeout(key: string, callback: () => void, delay: number): void;
  clearTimeout(key: string): void;

  // Handle-based API (Unified TimerService 호환)
  createTimer(callback: () => void, delay: number): UnifiedTimerHandle;

  // Simple API (Performance TimerService 호환)
  set(key: string, callback: () => void, delay: number): void;
  clear(key: string): void;

  // 공통 관리 API
  clearAllTimers(): void;
  getActiveTimerCount(): number;
  hasTimer(key: string): boolean;
}

/**
 * 통합 Timer Service 구현
 * 모든 기존 TimerService들의 기능을 포함하는 단일 구현
 */
export class UnifiedTimerService implements IUnifiedTimerService {
  private readonly timers = new Map<string, number>();
  private readonly handles = new Map<string, UnifiedTimerHandle>();
  private nextId = 1;

  // Key-based API
  setTimeout(key: string, callback: () => void, delay: number): void {
    this.clearTimeout(key);
    const timerId = window.setTimeout(() => {
      this.timers.delete(key);
      this.handles.delete(key);
      callback();
    }, delay);

    this.timers.set(key, timerId);
    this.handles.set(key, {
      id: key,
      cancel: () => this.clearTimeout(key),
    });

    logger.debug(`UnifiedTimer: set ${key} (${delay}ms)`);
  }

  clearTimeout(key: string): void {
    const timerId = this.timers.get(key);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      this.timers.delete(key);
      this.handles.delete(key);
      logger.debug(`UnifiedTimer: cleared ${key}`);
    }
  }

  // Handle-based API
  createTimer(callback: () => void, delay: number): UnifiedTimerHandle {
    const key = `auto_${this.nextId++}`;
    this.setTimeout(key, callback, delay);
    return this.handles.get(key)!;
  }

  // Simple API (별칭)
  set(key: string, callback: () => void, delay: number): void {
    this.setTimeout(key, callback, delay);
  }

  clear(key: string): void {
    this.clearTimeout(key);
  }

  // 공통 관리 API
  clearAllTimers(): void {
    for (const [_key, timerId] of this.timers) {
      window.clearTimeout(timerId);
    }
    this.timers.clear();
    this.handles.clear();
    logger.debug('UnifiedTimer: all timers cleared');
  }

  getActiveTimerCount(): number {
    return this.timers.size;
  }

  hasTimer(key: string): boolean {
    return this.timers.has(key);
  }
}

// ========================================
// UNIFIED RESOURCE SERVICE
// ========================================

/**
 * 통합 Resource Service 인터페이스
 */
export interface IUnifiedResourceService {
  // Key-based API (Unified ResourceService 호환)
  register(id: string, cleanup: () => void): void;
  release(id: string): boolean;

  // Simple API (Performance ResourceService 호환)
  registerSimple(cleanup: () => void): string;
  releaseSimple(cleanup: () => void): void;

  // 공통 관리 API
  releaseAll(): void;
  getResourceCount(): number;
  hasResource(id: string): boolean;
  getAllResourceIds(): string[];
}

/**
 * 통합 Resource Service 구현
 */
export class UnifiedResourceService implements IUnifiedResourceService {
  private readonly keyedResources = new Map<string, () => void>();
  private readonly simpleResources = new Set<() => void>();
  private nextId = 1;

  // Key-based API
  register(id: string, cleanup: () => void): void {
    this.keyedResources.set(id, cleanup);
    logger.debug(`UnifiedResource: registered ${id}`);
  }

  release(id: string): boolean {
    const cleanup = this.keyedResources.get(id);
    if (cleanup) {
      try {
        cleanup();
        this.keyedResources.delete(id);
        logger.debug(`UnifiedResource: released ${id}`);
        return true;
      } catch (error) {
        logger.warn(`UnifiedResource: failed to release ${id}:`, error);
        return false;
      }
    }
    return false;
  }

  // Simple API
  registerSimple(cleanup: () => void): string {
    const id = `simple_${this.nextId++}`;
    this.keyedResources.set(id, cleanup);
    this.simpleResources.add(cleanup);
    logger.debug(`UnifiedResource: registered simple resource ${id}`);
    return id;
  }

  releaseSimple(cleanup: () => void): void {
    this.simpleResources.delete(cleanup);
    // keyedResources에서도 찾아서 제거
    for (const [id, storedCleanup] of this.keyedResources) {
      if (storedCleanup === cleanup) {
        this.keyedResources.delete(id);
        break;
      }
    }
    logger.debug('UnifiedResource: released simple resource');
  }

  // 공통 관리 API
  releaseAll(): void {
    const errors: Error[] = [];

    for (const [id, cleanup] of this.keyedResources) {
      try {
        cleanup();
      } catch (error) {
        logger.warn(`UnifiedResource: failed to release ${id}:`, error);
        errors.push(error as Error);
      }
    }

    this.keyedResources.clear();
    this.simpleResources.clear();

    if (errors.length > 0) {
      logger.warn(`UnifiedResource: released all resources with ${errors.length} errors`);
    } else {
      logger.debug('UnifiedResource: all resources released successfully');
    }
  }

  getResourceCount(): number {
    return this.keyedResources.size;
  }

  hasResource(id: string): boolean {
    return this.keyedResources.has(id);
  }

  getAllResourceIds(): string[] {
    return Array.from(this.keyedResources.keys());
  }
}

// ========================================
// UNIFIED SERVICE MANAGER
// ========================================

/**
 * 간소화된 Service Manager 인터페이스
 */
export interface IUnifiedServiceManager {
  // 기본 서비스 관리
  register<T>(key: string, instance: T): void;
  get<T>(key: string): T;
  has(key: string): boolean;

  // 유틸리티
  getRegisteredServices(): string[];
  cleanup(): void;
  reset(): void;
}

/**
 * 통합 Service Manager 구현
 * CoreService의 복잡한 인터페이스를 단순화
 */
export class UnifiedServiceManager implements IUnifiedServiceManager {
  private static instance: UnifiedServiceManager | null = null;
  private readonly services = new Map<string, unknown>();

  private constructor() {
    logger.debug('[UnifiedServiceManager] 초기화됨');
  }

  static getInstance(): UnifiedServiceManager {
    if (!UnifiedServiceManager.instance) {
      UnifiedServiceManager.instance = new UnifiedServiceManager();
    }
    return UnifiedServiceManager.instance;
  }

  static resetInstance(): void {
    if (UnifiedServiceManager.instance) {
      UnifiedServiceManager.instance.reset();
      UnifiedServiceManager.instance = null;
      logger.debug('[UnifiedServiceManager] 싱글톤 초기화됨');
    }
  }

  // 기본 서비스 관리
  register<T>(key: string, instance: T): void {
    if (this.services.has(key)) {
      logger.warn(`[UnifiedServiceManager] 서비스 중복 등록 무시: ${key}`);
      return;
    }
    this.services.set(key, instance);
    logger.debug(`[UnifiedServiceManager] 서비스 등록: ${key}`);
  }

  get<T>(key: string): T {
    const instance = this.services.get(key);
    if (!instance) {
      throw new Error(`서비스를 찾을 수 없습니다: ${key}`);
    }
    return instance as T;
  }

  has(key: string): boolean {
    return this.services.has(key);
  }

  // 유틸리티
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  cleanup(): void {
    logger.debug('[UnifiedServiceManager] cleanup 시작');

    for (const [key, instance] of this.services) {
      if (instance && typeof instance === 'object' && 'cleanup' in instance) {
        try {
          (instance as { cleanup(): void }).cleanup();
          logger.debug(`[UnifiedServiceManager] ${key} cleanup 완료`);
        } catch (error) {
          logger.warn(`[UnifiedServiceManager] ${key} cleanup 실패:`, error);
        }
      }
    }

    logger.debug('[UnifiedServiceManager] cleanup 완료');
  }

  reset(): void {
    this.services.clear();
    logger.debug('[UnifiedServiceManager] 모든 서비스 초기화됨');
  }
}

// ========================================
// SINGLETON INSTANCES
// ========================================

/**
 * 통합된 서비스 인스턴스들
 */
export const unifiedTimerService = new UnifiedTimerService();
export const unifiedResourceService = new UnifiedResourceService();
export const unifiedServiceManager = UnifiedServiceManager.getInstance();

// ========================================
// BACKWARD COMPATIBILITY EXPORTS
// ========================================

/**
 * 기존 코드와의 호환성을 위한 별칭들
 */
export const TimerService = unifiedTimerService;
export const ResourceService = unifiedResourceService;
export const ServiceManager = unifiedServiceManager;

// 전역 인스턴스들 (backward compatibility)
export const globalTimerService = unifiedTimerService;
export const globalResourceService = unifiedResourceService;
