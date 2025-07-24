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
 * 서비스 상태 (ServiceResolver에서 이동)
 */
export type ServiceState = 'registered' | 'initializing' | 'initialized' | 'error' | 'destroyed';

/**
 * 서비스 인스턴스 레코드 (ServiceResolver에서 이동)
 */
export interface ServiceInstance<T = unknown> {
  instance?: T;
  state: ServiceState;
  error?: Error;
  createdAt?: number;
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
  private readonly instances = new Map<string, ServiceInstance>();

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

    let instance = this.instances.get(key);

    // 인스턴스 레코드가 없으면 생성
    if (!instance) {
      instance = { state: 'registered' };
      this.instances.set(key, instance);
    }

    // 이미 초기화된 경우
    if (instance.instance && instance.state === 'initialized') {
      return instance.instance as T;
    }

    // 에러 상태인 경우 재시도
    if (instance.state === 'error') {
      logger.warn(`[ServiceManager] 실패한 서비스 재시도: ${key}`);
    }

    instance.state = 'initializing';

    try {
      // 새 인스턴스 생성
      const newInstance = config.factory();
      instance.instance = newInstance;
      instance.state = 'initialized';
      instance.createdAt = Date.now();

      logger.debug(`[ServiceManager] 서비스 생성: ${key}`);
      return newInstance as T;
    } catch (error) {
      instance.state = 'error';
      instance.error = error as Error;
      logger.error(`[ServiceManager] 서비스 생성 실패: ${key}`, error);
      throw error;
    }
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
    return Array.from(this.instances.entries())
      .filter(([, instance]) => instance.state === 'initialized')
      .map(([key]) => key);
  }

  /**
   * 서비스 초기화 상태 확인 (ServiceResolver에서 이동)
   */
  public isInitialized(key: string): boolean {
    const instance = this.instances.get(key);
    return instance?.state === 'initialized' && !!instance.instance;
  }

  /**
   * 서비스 상태 조회 (ServiceResolver에서 이동)
   */
  public getState(key: string): ServiceState {
    return this.instances.get(key)?.state ?? 'registered';
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
    for (const [key, instanceRecord] of this.instances) {
      const instance = instanceRecord.instance;
      if (instance && typeof instance === 'object' && 'cleanup' in instance) {
        try {
          (instance as { cleanup(): void }).cleanup();
          logger.debug(`[ServiceManager] ${key} cleanup 완료`);
        } catch (error) {
          logger.warn(`[ServiceManager] ${key} cleanup 실패:`, error);
        }
      }
      // 상태를 destroyed로 변경
      instanceRecord.state = 'destroyed';
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
