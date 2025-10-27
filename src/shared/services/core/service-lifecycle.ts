/**
 * @fileoverview BaseService 생명주기 관리자
 * @description BaseService 등록 및 생명주기 관리 전담
 * @version 1.0.0 - Phase C: Service Manager 분리 (Phase A5.2 기반)
 */

import { logger } from '../../logging';
import type { BaseService } from '../../types/core/base-service.types';

/**
 * BaseService 생명주기 관리자
 * BaseService 인스턴스 등록, 초기화, 정리만 수행
 */
export class ServiceLifecycleManager {
  private readonly baseServices = new Map<string, BaseService>();
  private readonly initializedServices = new Set<string>();

  constructor() {
    logger.debug('[ServiceLifecycleManager] 초기화됨');
  }

  /**
   * BaseService 등록
   */
  public registerBaseService(key: string, service: BaseService): void {
    if (this.baseServices.has(key)) {
      logger.warn(`[ServiceLifecycleManager] BaseService 덮어쓰기: ${key}`);
    }
    this.baseServices.set(key, service);
    logger.debug(`[ServiceLifecycleManager] BaseService 등록: ${key}`);
  }

  /**
   * BaseService 조회
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
   */
  public tryGetBaseService(key: string): BaseService | null {
    return this.baseServices.get(key) ?? null;
  }

  /**
   * BaseService 초기화
   */
  public async initializeBaseService(key: string): Promise<void> {
    const service = this.getBaseService(key);

    if (this.initializedServices.has(key)) {
      logger.debug(`[ServiceLifecycleManager] 이미 초기화됨: ${key}`);
      return;
    }

    try {
      logger.debug(`[ServiceLifecycleManager] BaseService 초기화 중: ${key}`);
      if (service.initialize) {
        await service.initialize();
      }
      this.initializedServices.add(key);
      logger.debug(`[ServiceLifecycleManager] BaseService 초기화 완료: ${key}`);
    } catch (error) {
      logger.error(`[ServiceLifecycleManager] BaseService 초기화 실패 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 모든 BaseService 초기화
   */
  public async initializeAllBaseServices(keys?: string[]): Promise<void> {
    const serviceKeys = keys || Array.from(this.baseServices.keys());
    logger.debug(`[ServiceLifecycleManager] ${serviceKeys.length}개 BaseService 초기화 중...`);

    for (const key of serviceKeys) {
      try {
        await this.initializeBaseService(key);
      } catch (error) {
        logger.error(
          `[ServiceLifecycleManager] BaseService 초기화 실패 (${key}), 계속 진행:`,
          error
        );
      }
    }

    logger.debug(`[ServiceLifecycleManager] 모든 BaseService 초기화 완료`);
  }

  /**
   * BaseService 상태 조회
   */
  public isBaseServiceInitialized(key: string): boolean {
    return this.initializedServices.has(key);
  }

  /**
   * 등록된 BaseService 목록
   */
  public getRegisteredBaseServices(): string[] {
    return Array.from(this.baseServices.keys());
  }

  /**
   * 모든 BaseService 정리
   */
  public cleanup(): void {
    logger.debug('[ServiceLifecycleManager] cleanup 시작');

    for (const [key, service] of this.baseServices) {
      if (this.initializedServices.has(key)) {
        try {
          if (service.destroy) {
            service.destroy();
            logger.debug(`[ServiceLifecycleManager] BaseService destroy 완료: ${key}`);
          }
        } catch (error) {
          logger.warn(`[ServiceLifecycleManager] BaseService destroy 실패 (${key}):`, error);
        }
      }
    }

    logger.debug('[ServiceLifecycleManager] cleanup 완료');
  }

  /**
   * 모든 BaseService 초기화 (테스트용)
   */
  public reset(): void {
    this.baseServices.clear();
    this.initializedServices.clear();
    logger.debug('[ServiceLifecycleManager] 모든 BaseService 초기화됨');
  }
}
