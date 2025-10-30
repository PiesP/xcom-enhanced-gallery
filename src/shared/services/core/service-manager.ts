/**
 * @fileoverview 단순화된 서비스 관리자 (Orchestrator Pattern)
 * @description 세 가지 관리자(Registry/Factory/Lifecycle)를 조율하는 중앙 관리자
 * @version 2.0.0 - Phase C: Service Manager 완전 분리 (위임 패턴)
 */

import { logger } from '../../logging';
import type { BaseService } from '../../types/core/base-service.types';
import { ServiceRegistry } from './service-registry';
import { ServiceFactoryManager } from './service-factory';
import { ServiceLifecycleManager } from './service-lifecycle';

/**
 * 중앙 서비스 관리자 (Orchestrator)
 *
 * 세 가지 전문화된 관리자에게 작업을 위임:
 * - ServiceRegistry: 직접 인스턴스 저장/조회
 * - ServiceFactoryManager: 팩토리 관리 및 캐싱
 * - ServiceLifecycleManager: BaseService 생명주기 관리
 */
export class CoreService {
  private static instance: CoreService | null = null;
  private readonly registry = new ServiceRegistry();
  private readonly factory = new ServiceFactoryManager();
  private readonly lifecycle = new ServiceLifecycleManager();

  private constructor() {
    logger.debug('[CoreService] 초기화됨 (Orchestrator Pattern)');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): CoreService {
    if (!CoreService.instance) {
      CoreService.instance = new CoreService();
    }
    return CoreService.instance;
  }

  // ====================================
  // Registry 위임 (저장소)
  // ====================================

  /**
   * 서비스 등록 (직접 인스턴스)
   */
  public register<T>(key: string, instance: T): void {
    this.registry.register<T>(key, instance);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    // 먼저 registry에서 조회
    if (this.registry.has(key)) {
      return this.registry.get<T>(key);
    }

    // 팩토리에서 생성
    const fromFactory = this.factory.createFromFactory<T>(key);
    if (fromFactory !== null) {
      return fromFactory;
    }

    throw new Error(`서비스를 찾을 수 없습니다: ${key}`);
  }

  /**
   * 안전한 서비스 조회 (오류 발생 시 null 반환)
   */
  public tryGet<T>(key: string): T | null {
    try {
      return this.get<T>(key);
    } catch {
      return null;
    }
  }

  /**
   * 서비스 존재 여부 확인
   */
  public has(key: string): boolean {
    return this.registry.has(key) || this.factory.hasFactory(key);
  }

  /**
   * 등록된 서비스 목록
   */
  public getRegisteredServices(): string[] {
    return this.registry.getRegisteredServices();
  }

  // ====================================
  // Factory 위임 (팩토리)
  // ====================================

  /**
   * 서비스 팩토리 등록
   */
  public registerFactory<T>(key: string, factory: () => T): void {
    this.factory.registerFactory<T>(key, factory);
  }

  // ====================================
  // Lifecycle 위임 (BaseService 생명주기)
  // ====================================

  /**
   * BaseService 등록 및 생명주기 관리
   */
  public registerBaseService(key: string, service: BaseService): void {
    this.lifecycle.registerBaseService(key, service);
  }

  /**
   * BaseService 조회
   */
  public getBaseService(key: string): BaseService {
    return this.lifecycle.getBaseService(key);
  }

  /**
   * BaseService 조회 (안전)
   */
  public tryGetBaseService(key: string): BaseService | null {
    return this.lifecycle.tryGetBaseService(key);
  }

  /**
   * BaseService 초기화
   */
  public async initializeBaseService(key: string): Promise<void> {
    return this.lifecycle.initializeBaseService(key);
  }

  /**
   * 모든 BaseService 초기화
   */
  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    return this.lifecycle.initializeAllBaseServices(keys);
  }

  /**
   * BaseService 상태 조회
   */
  public isBaseServiceInitialized(key: string): boolean {
    return this.lifecycle.isBaseServiceInitialized(key);
  }

  /**
   * 등록된 BaseService 목록
   */
  public getRegisteredBaseServices(): string[] {
    return this.lifecycle.getRegisteredBaseServices();
  }

  // ====================================
  // Diagnostics (진단)
  // ====================================

  /**
   * 진단 정보 조회
   * @returns 서비스 등록/활성화 상태 및 서비스 목록
   */
  public getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: Record<string, boolean>;
  } {
    const services = this.getRegisteredServices();
    const instances: Record<string, boolean> = {};

    for (const key of services) {
      instances[key] = this.registry.has(key);
    }

    return {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      services,
      instances,
    };
  }

  // ====================================
  // Cleanup & Reset
  // ====================================

  /**
   * 리소스 정리 및 cleanup
   */
  public cleanup(): void {
    logger.debug('[CoreService] cleanup 시작');
    this.lifecycle.cleanup();
    this.registry.cleanup();
    logger.debug('[CoreService] cleanup 완료');
  }

  /**
   * 모든 서비스 초기화 (테스트용)
   */
  public reset(): void {
    this.registry.reset();
    this.factory.reset();
    this.lifecycle.reset();
    logger.debug('[CoreService] 모든 서비스 초기화됨');
  }

  /**
   * 싱글톤 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (CoreService.instance) {
      CoreService.instance.reset();
      CoreService.instance = null;
      logger.debug('[CoreService] 싱글톤 초기화됨');
    }
  }
}

/**
 * 전역 서비스 관리자 인스턴스
 */
export const serviceManager = CoreService.getInstance();

/**
 * 타입 안전한 서비스 접근을 위한 헬퍼 함수
 * 항상 최신 인스턴스에서 서비스를 가져옵니다 (테스트 환경 대응)
 */
export function getService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

/**
 * Phase 6: 서비스 팩토리 등록 전역 함수 (테스트 사용)
 */
export function registerServiceFactory<T>(key: string, factory: () => T): void {
  CoreService.getInstance().registerFactory<T>(key, factory);
}

// Phase 137: 테스트 호환 - 전역 네임스페이스에 노출 (개발/테스트 환경에서만)
// 주의: 이 코드는 Vite 환경에서만 작동합니다.
// Vite가 import.meta.env를 자동으로 변환하므로, 런타임에는 문제없습니다.
try {
  // @ts-ignore - Vite 환경 전용
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viteEnv = (globalThis as any)['__VITE_ENV__'] || import.meta.env;
  if (viteEnv?.DEV || viteEnv?.MODE === 'test') {
    const kRegister = 'registerService' + 'Factory';
    const globalRecord = globalThis as Record<string, unknown>;
    globalRecord[kRegister] = registerServiceFactory as unknown as object;
  }
} catch {
  // Vite 환경이 아닌 경우 무시
}
