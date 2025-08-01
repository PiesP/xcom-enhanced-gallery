/**
 * @fileoverview 단순화된 서비스 관리자
 * @description 유저스크립트에 적합한 간단한 서비스 저장소
 * @version 1.0.0 - Phase 5: 서비스 레이어 단순화
 */

import { logger } from '@shared/logging/logger';

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
    if (this.services.has(key)) {
      logger.warn(`[CoreService] 서비스 덮어쓰기: ${key}`);
    }

    this.services.set(key, instance);
    logger.debug(`[CoreService] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    const instance = this.services.get(key);
    if (!instance) {
      throw new Error(`서비스를 찾을 수 없습니다: ${key}`);
    }
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
   * 진단 정보 조회
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

    // 인스턴스들 중 cleanup 메서드가 있으면 호출
    for (const [key, instance] of this.services) {
      if (instance && typeof instance === 'object' && 'cleanup' in instance) {
        try {
          (instance as { cleanup(): void }).cleanup();
          logger.debug(`[ServiceManager] ${key} cleanup 완료`);
        } catch (error) {
          logger.warn(`[ServiceManager] ${key} cleanup 실패:`, error);
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
    logger.debug('[ServiceManager] 모든 서비스 초기화됨');
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
