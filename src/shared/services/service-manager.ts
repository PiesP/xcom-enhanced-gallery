/**
 * @fileoverview REFACTOR: 단순화된 서비스 관리자 - 통합 서비스 사용
 * @description 유저스크립트에 적합한 간단한 서비스 저장소 + 통합 서비스 마이그레이션
 * @version 1.1.0 - TDD REFACTOR Phase - 통합 서비스 사용
 */

import { logger } from '@shared/logging';
import { unifiedServiceManager } from '@shared/services/unified-services';

/**
 * 하위 호환성을 위한 CoreService 래퍼
 * @deprecated 새로운 코드에서는 unifiedServiceManager를 직접 사용하세요
 */
export class CoreService {
  private static instance: CoreService | null = null;

  private constructor() {
    logger.debug('[CoreService] 초기화됨 (통합 서비스 래퍼)');
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
   * 서비스 등록 (통합 서비스 사용) - 중복 등록 방지
   */
  public register<T>(key: string, instance: T): void {
    if (unifiedServiceManager.has(key)) {
      logger.warn(`[CoreService] 서비스 중복 등록 시도 차단: ${key}`);
      return; // 중복 등록 차단
    }

    unifiedServiceManager.register(key, instance);
    logger.debug(`[CoreService] 서비스 등록 (via unified): ${key}`);
  }

  /**
   * 서비스 조회 (통합 서비스 사용)
   */
  public get<T>(key: string): T {
    return unifiedServiceManager.get<T>(key);
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
   * 서비스 존재 여부 확인 (통합 서비스 사용)
   */
  public has(key: string): boolean {
    return unifiedServiceManager.has(key);
  }

  /**
   * 등록된 서비스 목록 (통합 서비스 사용)
   */
  public getRegisteredServices(): string[] {
    return unifiedServiceManager.getRegisteredServices();
  }

  /**
   * 진단 정보 조회 (통합 서비스 사용)
   */
  public getDiagnostics(): {
    registeredServices: number;
    activeInstances: number;
    services: string[];
    instances: Record<string, boolean>;
  } {
    const services = unifiedServiceManager.getRegisteredServices();
    const instances: Record<string, boolean> = {};

    for (const key of services) {
      instances[key] = unifiedServiceManager.has(key);
    }

    return {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      services,
      instances,
    };
  }

  /**
   * 리소스 정리 및 cleanup (통합 서비스 사용)
   */
  public cleanup(): void {
    logger.debug('[ServiceManager] cleanup 시작');
    unifiedServiceManager.cleanup();
    logger.debug('[ServiceManager] cleanup 완료');
  }

  /**
   * 모든 서비스 초기화 (통합 서비스 사용)
   */
  public reset(): void {
    unifiedServiceManager.reset();
    logger.debug('[ServiceManager] 모든 서비스 초기화됨 (via unified)');
  }

  // ====================================
  // 진단 기능 (ServiceDiagnostics 통합)
  // ====================================

  /**
   * ServiceManager 상태 진단
   */
  public async diagnoseServiceManager(): Promise<void> {
    try {
      logger.info('🔍 ServiceManager 진단 시작');

      // 등록 상태 확인
      const diagnostics = this.getDiagnostics();
      logger.info('📊 진단 결과:', {
        registeredCount: diagnostics.registeredServices,
        activeInstances: diagnostics.activeInstances,
        services: diagnostics.services,
        instances: diagnostics.instances,
      });

      // 등록된 서비스 목록
      logger.debug('🗂️ 등록된 서비스:', diagnostics.services);

      logger.info('✅ CoreService 진단 완료');
    } catch (error) {
      logger.error('❌ CoreService 진단 실패:', error);
    }
  }

  /**
   * 서비스 상태 진단 (정적 메서드)
   */
  public static async diagnoseServiceManager(): Promise<void> {
    const instance = CoreService.getInstance();
    return instance.diagnoseServiceManager();
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
