/**
 * @fileoverview 서비스 팩토리 관리자
 * @description 팩토리 등록/캐싱 기능 전담
 * @version 1.0.0 - Phase C: Service Manager 분리
 */

import { logger } from '../../logging';

/**
 * 서비스 팩토리 관리자
 * 팩토리 함수 등록 및 캐싱만 수행
 */
export class ServiceFactoryManager {
  private readonly factories = new Map<string, () => unknown>();
  private readonly factoryCache = new Map<string, unknown>();

  constructor() {
    logger.debug('[ServiceFactoryManager] 초기화됨');
  }

  /**
   * 서비스 팩토리 등록
   * 동일 key 재등록 시 경고 후 무시
   */
  public registerFactory<T>(key: string, factory: () => T): void {
    if (this.factories.has(key)) {
      logger.warn(`[ServiceFactoryManager] 팩토리 중복 등록 무시: ${key}`);
      return;
    }
    this.factories.set(key, factory);
    logger.debug(`[ServiceFactoryManager] 서비스 팩토리 등록: ${key}`);
  }

  /**
   * 팩토리에서 서비스 인스턴스 생성 (캐싱)
   */
  public createFromFactory<T>(key: string): T | null {
    if (this.factoryCache.has(key)) {
      return this.factoryCache.get(key) as T;
    }

    const factory = this.factories.get(key);
    if (!factory) {
      return null;
    }

    try {
      const created = factory();
      this.factoryCache.set(key, created);
      logger.debug(`[ServiceFactoryManager] 팩토리에서 인스턴스 생성: ${key}`);
      return created as T;
    } catch (error) {
      logger.error(`[ServiceFactoryManager] 팩토리 실행 실패 (${key}):`, error);
      throw error;
    }
  }

  /**
   * 팩토리 등록 여부 확인
   */
  public hasFactory(key: string): boolean {
    return this.factories.has(key);
  }

  /**
   * 등록된 팩토리 목록
   */
  public getRegisteredFactories(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * 모든 팩토리 초기화 (테스트용)
   */
  public reset(): void {
    this.factories.clear();
    this.factoryCache.clear();
    logger.debug('[ServiceFactoryManager] 모든 팩토리 초기화됨');
  }
}
