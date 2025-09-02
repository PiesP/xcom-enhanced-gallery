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
  private readonly aliases = new Map<string, string>(); // 별칭 -> 원본 키 매핑

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
   * Phase 10.2.B: 중복 등록 완전 차단
   */
  public register<T>(key: string, instance: T, allowOverwrite = false): void {
    if (this.services.has(key)) {
      if (!allowOverwrite) {
        logger.debug(`[CoreService] 서비스 이미 등록됨, 중복 무시: ${key}`);
        return; // 중복 등록 완전 차단
      }
      logger.warn(`[CoreService] 서비스 명시적 덮어쓰기: ${key}`);
    }

    this.services.set(key, instance);
    logger.debug(`[CoreService] 서비스 등록: ${key}`);
  }

  /**
   * 서비스 조회
   */
  public get<T>(key: string): T {
    // 별칭인지 확인하고 원본 키로 변환
    const resolvedKey = this.aliases.get(key) || key;
    const instance = this.services.get(resolvedKey);
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
    // 별칭인지 확인하고 원본 키로 변환
    const resolvedKey = this.aliases.get(key) || key;
    return this.services.has(resolvedKey);
  }

  /**
   * 서비스 별칭 등록
   */
  public registerAlias(aliasKey: string, originalKey: string): void {
    // 별칭 체인 방지 - 원본 키가 별칭인지 먼저 확인
    if (this.aliases.has(originalKey)) {
      throw new Error(`별칭 체인은 지원하지 않습니다: ${originalKey}`);
    }

    // 원본 서비스가 존재하는지 확인
    if (!this.services.has(originalKey)) {
      throw new Error(`별칭 등록 실패: 원본 서비스를 찾을 수 없습니다: ${originalKey}`);
    }

    // 기존 별칭 덮어쓰기 경고
    if (this.aliases.has(aliasKey)) {
      logger.warn(`[CoreService] 별칭 덮어쓰기: ${aliasKey}`);
    }

    this.aliases.set(aliasKey, originalKey);
    logger.debug(`[CoreService] 별칭 등록: ${aliasKey} -> ${originalKey}`);
  }

  /**
   * 특정 서비스의 모든 별칭 조회
   */
  public getAliases(serviceKey: string): string[] {
    const aliases: string[] = [];
    for (const [alias, original] of this.aliases) {
      if (original === serviceKey) {
        aliases.push(alias);
      }
    }
    return aliases;
  }

  /**
   * 별칭 제거
   */
  public removeAlias(aliasKey: string): boolean {
    const removed = this.aliases.delete(aliasKey);
    if (removed) {
      logger.debug(`[CoreService] 별칭 제거: ${aliasKey}`);
    }
    return removed;
  }

  /**
   * 등록된 서비스 목록
   */
  public getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
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
    this.aliases.clear();
    logger.debug('[ServiceManager] 모든 서비스 초기화됨');
  }

  // ====================================
  // 진단 기능 (ServiceDiagnostics 통합)
  // ====================================

  /**
   * 진단 정보 반환 (통합된 진단 메서드)
   */
  public getDiagnostics(options?: { log?: boolean }): {
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

    const diagnostics = {
      registeredServices: services.length,
      activeInstances: services.filter(key => instances[key]).length,
      services,
      instances,
    };

    // 로깅 옵션이 활성화된 경우 진단 정보 출력
    if (options?.log) {
      try {
        logger.info('🔍 ServiceManager 진단 시작');

        logger.info('📊 진단 결과:', {
          registeredCount: diagnostics.registeredServices,
          activeInstances: diagnostics.activeInstances,
          services: diagnostics.services,
          instances: diagnostics.instances,
        });

        logger.debug('🗂️ 등록된 서비스:', diagnostics.services);
        logger.info('✅ CoreService 진단 완료');
      } catch (error) {
        logger.error('❌ CoreService 진단 실패:', error);
      }
    }

    return diagnostics;
  }

  /**
   * 비동기 진단 (호환성을 위한 래퍼)
   * @deprecated getDiagnostics({ log: true })를 사용하세요
   */
  public async diagnoseServiceManager(): Promise<void> {
    logger.warn(
      '[CoreService] diagnoseServiceManager()는 deprecated입니다. getDiagnostics({ log: true })를 사용하세요.'
    );
    this.getDiagnostics({ log: true });
  }

  /**
   * 서비스 상태 진단 (정적 메서드)
   * @deprecated CoreService.getInstance().getDiagnostics({ log: true })를 사용하세요
   */
  public static async diagnoseServiceManager(): Promise<void> {
    logger.warn('[CoreService] static diagnoseServiceManager()는 deprecated입니다.');
    const instance = CoreService.getInstance();
    instance.getDiagnostics({ log: true });
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
