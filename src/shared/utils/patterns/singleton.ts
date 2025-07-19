/**
 * @fileoverview 표준화된 Singleton 패턴 구현
 * @version 2.0.0
 *
 * Clean Architecture 원칙에 따른 통합된 Singleton 관리
 */

import { logger } from '@core/logging/logger';

/**
 * Singleton 인터페이스 정의
 */
export interface SingletonConstructor<T> {
  getInstance(): T;
  resetInstance?(): void;
}

/**
 * Singleton 메타데이터
 */
interface SingletonMetadata {
  name: string;
  created: number;
  resetCount: number;
}

/**
 * 전역 Singleton 레지스트리
 * 모든 Singleton 인스턴스를 중앙에서 관리
 */
class SingletonRegistry {
  private static instance: SingletonRegistry | null = null;
  private readonly instances = new Map<string, unknown>();
  private readonly metadata = new Map<string, SingletonMetadata>();

  private constructor() {
    logger.debug('[SingletonRegistry] Initialized');
  }

  public static getInstance(): SingletonRegistry {
    SingletonRegistry.instance ??= new SingletonRegistry();
    return SingletonRegistry.instance;
  }

  /**
   * Singleton 인스턴스 등록
   */
  public register<T>(name: string, instance: T): T {
    if (this.instances.has(name)) {
      logger.warn(`[SingletonRegistry] Overwriting existing singleton: ${name}`);
    }

    this.instances.set(name, instance);
    this.metadata.set(name, {
      name,
      created: Date.now(),
      resetCount: 0,
    });

    logger.debug(`[SingletonRegistry] Registered singleton: ${name}`);
    return instance;
  }

  /**
   * Singleton 인스턴스 조회
   */
  public get<T>(name: string): T | null {
    return (this.instances.get(name) as T) || null;
  }

  /**
   * Singleton 인스턴스 초기화
   */
  public reset(name: string): boolean {
    const existed = this.instances.delete(name);
    if (existed) {
      const meta = this.metadata.get(name);
      if (meta) {
        meta.resetCount++;
        this.metadata.set(name, meta);
      }
      logger.debug(`[SingletonRegistry] Reset singleton: ${name}`);
    }
    return existed;
  }

  /**
   * 모든 Singleton 초기화 (테스트용)
   */
  public resetAll(): void {
    const count = this.instances.size;
    this.instances.clear();
    this.metadata.clear();
    logger.debug(`[SingletonRegistry] Reset all singletons: ${count} instances`);
  }

  /**
   * Singleton 목록 조회
   */
  public list(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 진단 정보 조회
   */
  public getDiagnostics(): Record<string, SingletonMetadata> {
    return Object.fromEntries(this.metadata.entries());
  }
}

/**
 * 표준 Singleton 기본 클래스
 */
export abstract class BaseSingleton {
  private static readonly registry = SingletonRegistry.getInstance();

  /**
   * Singleton 인스턴스 생성 또는 조회
   */
  public static getOrCreateInstance<T>(name: string, factory: () => T): T {
    const existing = BaseSingleton.registry.get<T>(name);
    if (existing) {
      return existing;
    }

    const instance = factory();
    return BaseSingleton.registry.register(name, instance);
  }

  /**
   * Singleton 인스턴스 초기화
   */
  public static resetInstance(name: string): boolean {
    return BaseSingleton.registry.reset(name);
  }

  /**
   * 모든 Singleton 초기화 (테스트용)
   */
  public static resetAllSingletons(): void {
    BaseSingleton.registry.resetAll();
  }

  /**
   * Singleton 진단 정보
   */
  public static getSingletonDiagnostics(): Record<string, SingletonMetadata> {
    return BaseSingleton.registry.getDiagnostics();
  }
}

/**
 * 간단한 Singleton 팩토리 함수
 */
export function createSingleton<T>(name: string, factory: () => T): SingletonConstructor<T> {
  return {
    getInstance: () => BaseSingleton.getOrCreateInstance(name, factory),
    resetInstance: () => BaseSingleton.resetInstance(name),
  };
}

/**
 * Lazy Singleton 헬퍼
 */
export function createLazySingleton<T>(name: string, factory: () => T): SingletonConstructor<T> {
  return {
    getInstance: () => BaseSingleton.getOrCreateInstance(name, factory),
    resetInstance: () => BaseSingleton.resetInstance(name),
  };
}

/**
 * 전역 Singleton 관리 함수들
 */
export const singletonManager = {
  /**
   * 모든 Singleton 초기화
   */
  resetAll: () => BaseSingleton.resetAllSingletons(),

  /**
   * Singleton 목록 조회
   */
  list: () => SingletonRegistry.getInstance().list(),

  /**
   * 진단 정보 조회
   */
  getDiagnostics: () => BaseSingleton.getSingletonDiagnostics(),
};
