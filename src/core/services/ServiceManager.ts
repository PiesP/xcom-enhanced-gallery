/**
 * @fileoverview 단순화된 서비스 관리자
 * @description 유저스크립트에 적합한 간단한 서비스 팩토리
 * @version 1.0.0 - 아키텍처 단순화
 */

import { logger } from '@core/logging/logger';

/**
 * 간단한 서비스 팩토리 함수
 */
export type ServiceFactory<T = unknown> = () => T;

/**
 * 기본 서비스 인터페이스
 */
export interface BaseService {
  cleanup?(): void;
}

/**
 * 간단한 서비스 설정
 */
export interface ServiceConfig<T = unknown> {
  /** 서비스 생성 팩토리 */
  factory: ServiceFactory<T>;
  /** 싱글톤 여부 (기본: true) */
  singleton?: boolean;
  /** 지연 로딩 여부 (기본: false) */
  lazy?: boolean;
}

/**
 * 단순화된 서비스 관리자
 *
 * 복잡한 DI 시스템을 제거하고 간단한 팩토리 패턴 적용
 * - 동기 팩토리만 지원
 * - 의존성 주입 제거
 * - 복잡한 생명주기 관리 제거
 */
export class ServiceManager {
  private static instance: ServiceManager | null = null;
  private readonly services = new Map<string, ServiceConfig>();
  private readonly instances = new Map<string, unknown>();

  private constructor() {
    logger.debug('[ServiceManager] 초기화됨');
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 서비스 등록
   */
  public register<T>(key: string, config: ServiceConfig<T>): void {
    if (this.services.has(key)) {
      logger.warn(`[ServiceManager] 서비스 덮어쓰기: ${key}`);
    }

    this.services.set(key, {
      singleton: true,
      lazy: false,
      ...config,
    });

    logger.debug(`[ServiceManager] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    const config = this.services.get(key);
    if (!config) {
      throw new Error(`서비스를 찾을 수 없습니다: ${key}`);
    }

    // 싱글톤인 경우 기존 인스턴스 확인
    if (config.singleton) {
      const existing = this.instances.get(key);
      if (existing) {
        return existing as T;
      }
    }

    // 새 인스턴스 생성
    const instance = config.factory();

    // 싱글톤인 경우 저장
    if (config.singleton) {
      this.instances.set(key, instance);
    }

    logger.debug(`[ServiceManager] 서비스 생성: ${key}`);
    return instance as T;
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
   * 생성된 인스턴스 목록
   */
  public getActiveInstances(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * 서비스 매니저 진단 정보
   */
  public getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: string[];
  } {
    return {
      registeredServices: this.services.size,
      activeInstances: this.instances.size,
      services: this.getRegisteredServices(),
      instances: this.getActiveInstances(),
    };
  }

  /**
   * 리소스 정리 및 cleanup
   */
  public cleanup(): void {
    logger.debug('[ServiceManager] cleanup 시작');

    // 인스턴스들 중 cleanup 메서드가 있으면 호출
    for (const [key, instance] of this.instances) {
      if (instance && typeof instance === 'object' && 'cleanup' in instance) {
        try {
          (instance as { cleanup(): void }).cleanup();
          logger.debug(`[ServiceManager] ${key} cleanup 완료`);
        } catch (error) {
          logger.warn(`[ServiceManager] ${key} cleanup 실패:`, error);
        }
      }
    }

    // 인스턴스 맵 정리
    this.instances.clear();
    logger.debug('[ServiceManager] cleanup 완료');
  }

  /**
   * 모든 서비스 초기화 (테스트용)
   */
  public reset(): void {
    this.services.clear();
    this.instances.clear();
    logger.debug('[ServiceManager] 모든 서비스 초기화됨');
  }

  /**
   * 싱글톤 인스턴스 초기화 (테스트용)
   */
  public static resetInstance(): void {
    if (ServiceManager.instance) {
      ServiceManager.instance.reset();
      ServiceManager.instance = null;
      logger.debug('[ServiceManager] 싱글톤 초기화됨');
    }
  }
}

/**
 * 전역 서비스 관리자 인스턴스
 */
export const serviceManager = ServiceManager.getInstance();

/**
 * 간편한 서비스 등록 헬퍼
 */
export function registerService<T>(
  key: string,
  factory: ServiceFactory<T>,
  singleton = true
): void {
  serviceManager.register(key, { factory, singleton });
}

/**
 * 간편한 서비스 조회 헬퍼
 */
export function getService<T>(key: string): T {
  return serviceManager.get<T>(key);
}
