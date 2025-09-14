/**
 * @fileoverview 단순화된 서비스 관리자
 * @description 유저스크립트에 적합한 간단한 서비스 저장소
 * @version 1.0.0 - Phase 5: 서비스 레이어 단순화
 */

import { logger } from '../logging/logger';

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

// 테스트 호환: 전역 네임스페이스에 노출 (개발/테스트 환경에서만)
if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
  const kRegister = 'registerService' + 'Factory';
  (globalThis as Record<string, unknown>)[kRegister] = registerServiceFactory as unknown as object;
}
