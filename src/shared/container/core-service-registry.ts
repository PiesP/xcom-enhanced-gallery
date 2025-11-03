/**
 * @fileoverview CoreServiceRegistry - 중앙화된 서비스 접근 및 캐싱
 * @description
 * 모든 서비스 접근을 단일 진입점으로 통합하고,
 * 캐싱 레이어를 통해 성능을 개선합니다.
 *
 * **내부 전용**: 일반 코드는 service-accessors.ts의 typed getter를 사용하세요.
 *
 * @example
 * ```typescript
 * // ❌ 직접 사용 금지 (내부용)
 * CoreServiceRegistry.get<ToastManager>(SERVICE_KEYS.TOAST);
 *
 * // ✅ 접근자 사용
 * getToastManager();
 * ```
 */

import { CoreService } from '../services/service-manager';

/**
 * 중앙화된 서비스 레지스트리
 * - 캐싱을 통한 성능 최적화
 * - 타입 안전한 접근
 * - CoreService와의 투명한 브릿지
 */
export class CoreServiceRegistry {
  /**
   * 서비스 인스턴스 캐시
   * @internal
   */
  private static readonly cache = new Map<string, unknown>();

  /**
   * 서비스 인스턴스를 조회합니다
   *
   * @template T - 서비스 타입
   * @param key - 서비스 키 (SERVICE_KEYS에서 선택)
   * @returns 캐시된 서비스 인스턴스 또는 CoreService에서 조회
   * @throws 서비스를 찾을 수 없으면 CoreService에서 예외 발생
   *
   * @example
   * ```typescript
   * const controller = CoreServiceRegistry.get<ToastController>(SERVICE_KEYS.TOAST);
   * ```
   */
  static get<T>(key: string): T {
    // 캐시에서 먼저 확인
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // CoreService에서 조회
    const service = CoreService.getInstance().get<T>(key);

    // 캐시에 저장
    this.cache.set(key, service);

    return service;
  }

  /**
   * 서비스 인스턴스를 안전하게 조회합니다 (없으면 null)
   *
   * @template T - 서비스 타입
   * @param key - 서비스 키
   * @returns 서비스 인스턴스 또는 null
   *
   * @example
   * ```typescript
   * const service = CoreServiceRegistry.tryGet<SettingsService>(SERVICE_KEYS.SETTINGS);
   * if (service) {
   *   // 사용
   * }
   * ```
   */
  static tryGet<T>(key: string): T | null {
    // 캐시에서 먼저 확인
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      return cached !== undefined ? (cached as T) : null;
    }

    // CoreService에서 안전 조회
    const service = CoreService.getInstance().tryGet<T>(key);

    // 캐시에 저장 (null도 저장하여 반복 조회 피함)
    if (service !== null) {
      this.cache.set(key, service);
    }

    return service;
  }

  /**
   * 서비스 인스턴스를 등록합니다
   *
   * @template T - 서비스 타입
   * @param key - 서비스 키 (SERVICE_KEYS에서 선택)
   * @param instance - 등록할 서비스 인스턴스
   *
   * @example
   * ```typescript
   * const controller = new ToastController();
   * CoreServiceRegistry.register<ToastController>(SERVICE_KEYS.TOAST, controller);
   * ```
   */
  static register<T>(key: string, instance: T): void {
    // CoreService에 등록
    CoreService.getInstance().register<T>(key, instance);

    // 캐시에도 저장
    this.cache.set(key, instance);
  }

  /**
   * 캐시를 초기화합니다
   *
   * @internal - 테스트 및 초기화 목적으로만 사용
   *
   * @example
   * ```typescript
   * // 테스트 정리 단계
   * CoreServiceRegistry.clearCache();
   * ```
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * 특정 서비스 캐시를 제거합니다
   *
   * @internal - 테스트 목적으로만 사용
   * @param key - 제거할 서비스 키
   */
  static invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 캐시 상태를 반환합니다 (디버깅 용도)
   *
   * @internal - 디버깅 목적으로만 사용
   * @returns 캐시된 서비스 키 배열
   */
  static getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * 헬퍼 함수: CoreServiceRegistry를 통한 서비스 조회
 *
 * @template T - 서비스 타입
 * @param key - 서비스 키
 * @returns 서비스 인스턴스
 */
export function getService<T>(key: string): T {
  return CoreServiceRegistry.get<T>(key);
}

/**
 * 헬퍼 함수: CoreServiceRegistry를 통한 안전한 서비스 조회
 *
 * @template T - 서비스 타입
 * @param key - 서비스 키
 * @returns 서비스 인스턴스 또는 null
 */
export function tryGetService<T>(key: string): T | null {
  return CoreServiceRegistry.tryGet<T>(key);
}

/**
 * 헬퍼 함수: CoreServiceRegistry를 통한 서비스 등록
 *
 * @template T - 서비스 타입
 * @param key - 서비스 키
 * @param instance - 서비스 인스턴스
 */
export function registerService<T>(key: string, instance: T): void {
  CoreServiceRegistry.register<T>(key, instance);
}
