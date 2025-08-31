/**
 * @fileoverview ServiceRegistry - 간단한 서비스 저장소
 * @description TDD Phase 1.1 - GREEN 단계: 최소 구현
 *
 * ServiceManager의 핵심 기능을 분리한 단순한 서비스 등록/조회 클래스
 */

import { logger } from '@shared/logging/logger';

/**
 * 단순한 서비스 저장소
 *
 * 책임:
 * - 서비스 인스턴스 등록/조회
 * - 타입 안전한 서비스 접근
 * - 기본적인 생명주기 관리
 */
export class ServiceRegistry {
  private readonly services = new Map<string, unknown>();

  /**
   * 서비스 등록
   *
   * @param key 서비스 키
   * @param instance 서비스 인스턴스
   * @param allowOverwrite 덮어쓰기 허용 여부 (기본: true)
   */
  public register<T>(key: string, instance: T, allowOverwrite = true): void {
    // 덮어쓰기 방지 검사
    if (!allowOverwrite && this.services.has(key)) {
      throw new Error(`Service already exists: ${key}`);
    }

    this.services.set(key, instance);
    logger.debug(`[ServiceRegistry] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회
   *
   * @param key 서비스 키
   * @returns 등록된 서비스 인스턴스
   * @throws Error 서비스가 존재하지 않는 경우
   */
  public get<T>(key: string): T {
    if (!this.services.has(key)) {
      throw new Error(`Service not found: ${key}`);
    }
    return this.services.get(key) as T;
  }

  /**
   * 안전한 서비스 조회 (오류 발생 시 null 반환)
   *
   * @param key 서비스 키
   * @returns 서비스 인스턴스 또는 null
   */
  public tryGet<T>(key: string): T | null {
    try {
      return this.get<T>(key);
    } catch (error) {
      logger.warn(`[ServiceRegistry] 서비스 조회 실패: ${key}`, error);
      return null;
    }
  }

  /**
   * 서비스 존재 여부 확인
   *
   * @param key 서비스 키
   * @returns 존재 여부
   */
  public has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * 등록된 서비스 목록 반환
   *
   * @returns 서비스 키 배열
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 모든 서비스 초기화 (테스트용)
   */
  public reset(): void {
    this.services.clear();
    logger.debug('[ServiceRegistry] 모든 서비스 초기화됨');
  }
}
