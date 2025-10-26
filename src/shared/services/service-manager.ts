/**
 * @fileoverview 단순화된 서비스 관리자
 * @description 유저스크립트에 적합한 간단한 서비스 저장소
 * @version 1.1.0 - Phase A5.2: BaseService 생명주기 중앙화
 */

import { logger } from '@shared/logging';
import type { BaseService } from '../types/core/base-service.types';

/**
 * 단순화된 서비스 저장소
 *
 * 복잡한 팩토리 패턴을 제거하고 단순한 인스턴스 저장소로 변경
 * - 직접 인스턴스 저장/조회만 지원
 * - 팩토리 패턴 제거
 * - 생명주기 관리 제거
 */
export class CoreService {
  private static instance: CoreService | null = null;
  private readonly services = new Map<string, unknown>();
  private readonly factories = new Map<string, () => unknown>();
  private readonly factoryCache = new Map<string, unknown>();
  // Phase A5.2: BaseService 생명주기 중앙화
  private readonly baseServices = new Map<string, BaseService>();
  private readonly initializedServices = new Set<string>();

  private constructor() {
    logger.debug('[CoreService] 초기화됨');
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

  /**
   * 서비스 등록 (직접 인스턴스)
   */
  public register<T>(key: string, instance: T): void {
    type CleanupCapable = { destroy?: () => void; cleanup?: () => void };
    if (this.services.has(key)) {
      logger.warn(`[CoreService] 서비스 덮어쓰기: ${key}`);
      const prev = this.services.get(key);
      // 기존 인스턴스가 리스너/타이머를 보유하고 있을 수 있으므로 안전하게 정리
      if (prev && typeof prev === 'object') {
        try {
          const p = prev as CleanupCapable;
          if (typeof p.destroy === 'function') {
            p.destroy();
          }
        } catch (error) {
          logger.warn(`[CoreService] 기존 인스턴스 destroy 실패 (${key}):`, error);
        }
        try {
          const p = prev as CleanupCapable;
          if (typeof p.cleanup === 'function') {
            p.cleanup();
          }
        } catch (error) {
          logger.warn(`[CoreService] 기존 인스턴스 cleanup 실패 (${key}):`, error);
        }
      }
    }

    this.services.set(key, instance);
    logger.debug(`[CoreService] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 팩토리 등록 (Phase 6 확장)
   * 동일 key 재등록 시 경고 후 무시
   */
  public registerFactory<T>(key: string, factory: () => T): void {
    if (this.factories.has(key) || this.services.has(key)) {
      logger.warn(`[CoreService] 팩토리 중복 등록 무시: ${key}`);
      return;
    }
    this.factories.set(key, factory);
    logger.debug(`[CoreService] 서비스 팩토리 등록: ${key}`);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    if (this.factoryCache.has(key)) {
      return this.factoryCache.get(key) as T;
    }
    const factory = this.factories.get(key);
    if (factory) {
      const created = factory();
      this.factoryCache.set(key, created);
      return created as T;
    }
    throw new Error(`서비스를 찾을 수 없습니다: ${key}`);
  }

  /**
   * 안전한 서비스 조회 (오류 발생 시 null 반환)
   */
  public tryGet<T>(key: string): T | null {
    try {
      return this.get<T>(key);
    } catch (error) {
      logger.warn(`[ServiceManager] 서비스 조회 실패: ${key}`, error);
      return null;
    }
  }

  /**
   * 서비스 존재 여부 확인
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 등록된 서비스 목록
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Phase A5.2: BaseService 등록 및 생명주기 관리
   * @param key 서비스 식별자
   * @param service BaseService 구현체
   */
  public registerBaseService(key: string, service: BaseService): void {
    if (this.baseServices.has(key)) {
      logger.warn(`[CoreService] BaseService 덮어쓰기: ${key}`);
    }
    this.baseServices.set(key, service);
    logger.debug(`[CoreService] BaseService 등록: ${key}`);
  }

  /**
   * BaseService 조회
   * @param key 서비스 식별자
   * @returns BaseService 구현체
   * @throws Error 서비스를 찾을 수 없을 때
   */
  public getBaseService(key: string): BaseService {
    const service = this.baseServices.get(key);
    if (!service) {
      throw new Error(`BaseService를 찾을 수 없습니다: ${key}`);
    }
    return service;
  }

  /**
   * BaseService 조회 (안전)
   * @param key 서비스 식별자
   * @returns BaseService 구현체 또는 null
   */
  public tryGetBaseService(key: string): BaseService | null {
    return this.baseServices.get(key) ?? null;
  }

  /**
   * BaseService 초기화
   * @param key 서비스 식별자
   */
  public async initializeBaseService(key: string): Promise<void> {
    const service = this.getBaseService(key);
    if (this.initializedServices.has(key)) {
      logger.debug(`[CoreService] 이미 초기화됨: ${key}`);
      return;
    }

    try {
      logger.debug(`[CoreService] BaseService 초기화 중: ${key}`);
      if (service.initialize) {
        await service.initialize();
      }
      this.initializedServices.add(key);
      logger.debug(`[CoreService] BaseService 초기화 완료: ${key}`);
    } catch (error) {
      logger.error(`[CoreService] BaseService 초기화 실패 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 모든 BaseService 초기화
   * @param keys 초기화할 서비스 키 배열 (순서대로 초기화)
   */
  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    const serviceKeys = keys || Array.from(this.baseServices.keys());
    logger.debug(`[CoreService] ${serviceKeys.length}개 BaseService 초기화 중...`);

    for (const key of serviceKeys) {
      try {
        await this.initializeBaseService(key);
      } catch (error) {
        logger.error(`[CoreService] BaseService 초기화 실패 (${key}), 계속 진행:`, error);
      }
    }

    logger.debug(`[CoreService] 모든 BaseService 초기화 완료`);
  }

  /**
   * BaseService 상태 조회
   * @param key 서비스 식별자
   * @returns 초기화 여부
   */
  public isBaseServiceInitialized(key: string): boolean {
    return this.initializedServices.has(key);
  }

  /**
   * 등록된 BaseService 목록
   * @returns 등록된 BaseService 키 배열
   */
  public getRegisteredBaseServices(): string[] {
    return Array.from(this.baseServices.keys());
  }

  /**
   * 진단 정보 조회
   * @deprecated v1.1.0 - UnifiedServiceDiagnostics.getServiceStatus()를 사용하세요
   */
  public getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: Record<string, boolean>;
  } {
    const services = Array.from(this.services.keys());
    const instances: Record<string, boolean> = {};

    for (const key of services) {
      instances[key] = this.services.get(key) !== null;
    }

    return {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      services,
      instances,
    };
  }

  /**
   * 리소스 정리 및 cleanup
   */
  public cleanup(): void {
    logger.debug('[ServiceManager] cleanup 시작');

    // Phase A5.2: BaseService destroy
    for (const [key, service] of this.baseServices) {
      if (this.initializedServices.has(key)) {
        try {
          if (service.destroy) {
            service.destroy();
            logger.debug(`[ServiceManager] BaseService destroy 완료: ${key}`);
          }
        } catch (error) {
          logger.warn(`[ServiceManager] BaseService destroy 실패 (${key}):`, error);
        }
      }
    }

    // 인스턴스들 중 cleanup 메서드가 있으면 호출
    for (const [key, instance] of this.services) {
      if (instance && typeof instance === 'object') {
        // 우선 destroy()가 있으면 호출 (리스너/리소스 강제 해제 보장)
        const inst = instance as { destroy?: () => void; cleanup?: () => void };
        if (typeof inst.destroy === 'function') {
          try {
            inst.destroy();
            logger.debug(`[ServiceManager] ${key} destroy 완료`);
          } catch (error) {
            logger.warn(`[ServiceManager] ${key} destroy 실패:`, error);
          }
        }

        // 이후 cleanup()이 있으면 추가로 호출
        if (typeof inst.cleanup === 'function') {
          try {
            inst.cleanup();
            logger.debug(`[ServiceManager] ${key} cleanup 완료`);
          } catch (error) {
            logger.warn(`[ServiceManager] ${key} cleanup 실패:`, error);
          }
        }
      }
    }

    logger.debug('[ServiceManager] cleanup 완료');
  }

  /**
   * 모든 서비스 초기화 (테스트용)
   */
  public reset(): void {
    this.services.clear();
    this.factories.clear();
    this.factoryCache.clear();
    // Phase A5.2: BaseService 리셋
    this.baseServices.clear();
    this.initializedServices.clear();
    logger.debug('[ServiceManager] 모든 서비스 초기화됨');
  }

  // ====================================
  // 진단 기능 (ServiceDiagnostics 통합)
  // ====================================

  // (removed) Diagnostics delegation methods were removed to avoid cyclic deps.

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
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  const kRegister = 'registerService' + 'Factory';
  const globalRecord = globalThis as Record<string, unknown>;
  globalRecord[kRegister] = registerServiceFactory as unknown as object;
}
