/**
 * @fileoverview Simple Service Registry
 * @description 간단하고 직접적인 서비스 레지스트리 - Phase 4 간소화
 */

import { logger } from '@shared/logging/logger';

/**
 * 간단한 서비스 레지스트리 - 복잡한 DI 컨테이너 대신 사용
 */
export class ServiceRegistry {
  private readonly services = new Map<string, unknown>();

  /**
   * 서비스 등록
   */
  register<T>(key: string, service: T): void {
    this.services.set(key, service);
    logger.debug(`Service registered: ${key}`);
  }

  /**
   * 서비스 가져오기
   */
  get<T>(key: string): T | undefined {
    return this.services.get(key) as T | undefined;
  }

  /**
   * 서비스 존재 여부 확인
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 서비스 제거
   */
  unregister(key: string): boolean {
    const removed = this.services.delete(key);
    if (removed) {
      logger.debug(`Service unregistered: ${key}`);
    }
    return removed;
  }

  /**
   * 모든 서비스 제거
   */
  clear(): void {
    this.services.clear();
    logger.debug('All services cleared');
  }

  /**
   * 등록된 서비스 키 목록
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.services.keys());
  }
}

// 전역 서비스 레지스트리 인스턴스
export const serviceRegistry = new ServiceRegistry();
export default serviceRegistry;
