/**
 * @fileoverview 단순화된 서비스 관리자 (기존 ServiceManager 대체)
 * @description 복잡한 DI 시스템을 단순한 팩토리 패턴으로 교체
 */

import { logger } from '@core/logging/logger';

/**
 * 간단한 서비스 팩토리 함수
 */
export type ServiceFactory<T = unknown> = () => T | Promise<T>;

/**
 * 기본 서비스 인터페이스
 */
export interface BaseService {
  cleanup?(): void | Promise<void>;
}

/**
 * 간단한 서비스 설정
 */
export interface ServiceConfig<T = unknown> {
  /** 서비스 생성 팩토리 */
  factory: ServiceFactory<T>;
  /** 싱글톤 여부 (기본: true) */
  singleton?: boolean;
}

/**
 * 단순화된 서비스 관리자 (기존 ServiceManager 대체)
 */
export class ServiceManager {
  private static instance: ServiceManager | null = null;
  private readonly services = new Map<string, ServiceConfig>();
  private readonly instances = new Map<string, unknown>();

  private constructor() {
    logger.debug('[ServiceManager] 단순화된 서비스 관리자 초기화됨');
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * 서비스 등록 (동기식)
   */
  register<T>(key: string, config: ServiceConfig<T>): void {
    this.services.set(key, config);
    logger.debug(`[ServiceManager] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회 (동기/비동기 지원)
   */
  async get<T>(key: string): Promise<T> {
    const config = this.services.get(key);
    if (!config) {
      throw new Error(`Service not found: ${key}`);
    }

    // 싱글톤 확인
    if (config.singleton !== false && this.instances.has(key)) {
      return this.instances.get(key) as T;
    }

    // 서비스 생성
    const service = await config.factory();
    
    // 싱글톤이면 인스턴스 저장
    if (config.singleton !== false) {
      this.instances.set(key, service);
    }

    return service as T;
  }

  /**
   * 서비스 존재 여부 확인
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 모든 서비스 정리
   */
  async cleanup(): Promise<void> {
    logger.info('[ServiceManager] 서비스들 정리 중...');

    const cleanupPromises = Array.from(this.instances.values()).map(async (service) => {
      try {
        if (service && typeof service === 'object' && 'cleanup' in service) {
          await (service as BaseService).cleanup?.();
        }
      } catch (error) {
        logger.warn('[ServiceManager] 서비스 정리 중 오류:', error);
      }
    });

    await Promise.all(cleanupPromises);

    this.services.clear();
    this.instances.clear();
    
    logger.info('[ServiceManager] 모든 서비스 정리 완료');
  }

  /**
   * 디버그 정보 조회
   */
  getDebugInfo(): {
    registeredServices: string[];
    instanceCount: number;
  } {
    return {
      registeredServices: Array.from(this.services.keys()),
      instanceCount: this.instances.size,
    };
  }
}

/**
 * 전역 서비스 관리자 인스턴스
 */
export const serviceManager = ServiceManager.getInstance();