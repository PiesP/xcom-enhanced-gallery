/**
 * @fileoverview ServiceAliasManager - 서비스 별칭 관리자
 * @description TDD Phase 1.2 - GREEN 단계: 최소 구현
 *
 * ServiceManager의 별칭 관리 기능을 분리한 독립적인 클래스
 */

import { logger } from '@shared/logging/logger';

/**
 * 서비스 별칭 관리자
 *
 * 책임:
 * - 서비스 키 별칭 등록/조회
 * - 별칭 체인 방지
 * - 별칭 생명주기 관리
 */
export class ServiceAliasManager {
  private readonly aliases = new Map<string, string>(); // 별칭 -> 원본 키 매핑

  /**
   * 별칭 등록
   *
   * @param aliasKey 별칭 키
   * @param originalKey 원본 서비스 키
   * @param allowOverwrite 덮어쓰기 허용 여부 (기본: true)
   */
  public registerAlias(aliasKey: string, originalKey: string, allowOverwrite = true): void {
    // 덮어쓰기 방지 검사
    if (!allowOverwrite && this.aliases.has(aliasKey)) {
      throw new Error(`Alias already exists: ${aliasKey}`);
    }

    // 별칭 체인 방지 - 원본 키가 이미 별칭인지 확인
    if (this.aliases.has(originalKey)) {
      throw new Error(`Alias chain not supported: ${originalKey} is already an alias`);
    }

    this.aliases.set(aliasKey, originalKey);
    logger.debug(`[ServiceAliasManager] 별칭 등록: ${aliasKey} -> ${originalKey}`);
  }

  /**
   * 별칭 해결 (별칭을 원본 키로 변환)
   *
   * @param key 별칭 또는 원본 키
   * @returns 원본 키 (별칭이 아닌 경우 입력값 그대로 반환)
   */
  public resolveAlias(key: string): string {
    return this.aliases.get(key) ?? key;
  }

  /**
   * 별칭 존재 여부 확인
   *
   * @param aliasKey 확인할 별칭 키
   * @returns 별칭 존재 여부
   */
  public hasAlias(aliasKey: string): boolean {
    return this.aliases.has(aliasKey);
  }

  /**
   * 특정 원본 키의 모든 별칭 조회
   *
   * @param originalKey 원본 서비스 키
   * @returns 해당 원본 키에 대한 모든 별칭 배열
   */
  public getAliasesFor(originalKey: string): string[] {
    const aliases: string[] = [];
    for (const [alias, original] of this.aliases) {
      if (original === originalKey) {
        aliases.push(alias);
      }
    }
    return aliases;
  }

  /**
   * 별칭 제거
   *
   * @param aliasKey 제거할 별칭 키
   * @returns 제거 성공 여부
   */
  public removeAlias(aliasKey: string): boolean {
    const removed = this.aliases.delete(aliasKey);
    if (removed) {
      logger.debug(`[ServiceAliasManager] 별칭 제거: ${aliasKey}`);
    }
    return removed;
  }

  /**
   * 등록된 모든 별칭 목록 반환
   *
   * @returns 모든 별칭 키 배열
   */
  public getAllAliases(): string[] {
    return Array.from(this.aliases.keys());
  }

  /**
   * 모든 별칭 초기화 (테스트용)
   */
  public reset(): void {
    this.aliases.clear();
    logger.debug('[ServiceAliasManager] 모든 별칭 초기화됨');
  }
}
