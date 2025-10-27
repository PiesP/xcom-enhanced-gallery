/**
 * @fileoverview 서비스 저장소 (registry only)
 * @description 서비스 인스턴스 저장/조회 기능 전담
 * @version 1.0.0 - Phase C: Service Manager 분리
 */

import { logger } from '../../logging';

type CleanupCapable = { destroy?: () => void; cleanup?: () => void };

/**
 * 서비스 저장소
 * 단순한 CRUD 기능만 수행 (저장/조회/삭제)
 */
export class ServiceRegistry {
  private readonly services = new Map<string, unknown>();

  constructor() {
    logger.debug('[ServiceRegistry] 초기화됨');
  }

  /**
   * 서비스 등록 (직접 인스턴스)
   */
  public register<T>(key: string, instance: T): void {
    if (this.services.has(key)) {
      logger.warn(`[ServiceRegistry] 서비스 덮어쓰기: ${key}`);
      const prev = this.services.get(key);
      // 기존 인스턴스가 리스너/타이머를 보유하고 있을 수 있으므로 안전하게 정리
      if (prev && typeof prev === 'object') {
        try {
          const p = prev as CleanupCapable;
          if (typeof p.destroy === 'function') {
            p.destroy();
          }
        } catch (error) {
          logger.warn(`[ServiceRegistry] 기존 인스턴스 destroy 실패 (${key}):`, error);
        }
        try {
          const p = prev as CleanupCapable;
          if (typeof p.cleanup === 'function') {
            p.cleanup();
          }
        } catch (error) {
          logger.warn(`[ServiceRegistry] 기존 인스턴스 cleanup 실패 (${key}):`, error);
        }
      }
    }

    this.services.set(key, instance);
    logger.debug(`[ServiceRegistry] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
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
      logger.warn(`[ServiceRegistry] 서비스 조회 실패: ${key}`);
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
   * 서비스 정리
   */
  public cleanup(): void {
    logger.debug('[ServiceRegistry] cleanup 시작');

    for (const [key, instance] of this.services) {
      if (instance && typeof instance === 'object') {
        const inst = instance as CleanupCapable;
        // destroy() 우선 호출
        if (typeof inst.destroy === 'function') {
          try {
            inst.destroy();
            logger.debug(`[ServiceRegistry] ${key} destroy 완료`);
          } catch (error) {
            logger.warn(`[ServiceRegistry] ${key} destroy 실패:`, error);
          }
        }

        // cleanup() 추가 호출
        if (typeof inst.cleanup === 'function') {
          try {
            inst.cleanup();
            logger.debug(`[ServiceRegistry] ${key} cleanup 완료`);
          } catch (error) {
            logger.warn(`[ServiceRegistry] ${key} cleanup 실패:`, error);
          }
        }
      }
    }

    logger.debug('[ServiceRegistry] cleanup 완료');
  }

  /**
   * 모든 서비스 초기화 (테스트용)
   */
  public reset(): void {
    this.services.clear();
    logger.debug('[ServiceRegistry] 모든 서비스 초기화됨');
  }
}
