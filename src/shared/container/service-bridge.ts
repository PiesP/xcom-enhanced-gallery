/**
 * @fileoverview Service Bridge - Features 레이어의 ServiceManager 접근 제어
 * @description
 * Features 레이어는 ServiceManager를 직접 import할 수 없습니다.
 * 대신 이 브릿지 함수들을 통해서만 접근할 수 있습니다.
 *
 * **내부 전용**: 일반 코드는 service-accessors.ts의 typed getter를 사용하세요.
 *
 * **용도별 선택**:
 * - 일반 서비스: `service-accessors.ts`의 typed getter (e.g., `getToastManager()`)
 * - 타입 숨김 필요: `bridgeGetService(key)` (순환 의존성 회피)
 * - BaseService 전용: `bridgeGetBaseService(key)`, `bridgeRegisterBaseService(...)`
 *
 * @example
 * ```typescript
 * // ❌ ServiceManager 직접 import 금지
 * import { CoreService } from '@shared/services/service-manager';
 *
 * // ✅ 브릿지 또는 접근자 사용
 * import { getToastManager } from '@shared/container/service-accessors';
 * import { bridgeGetService } from '@shared/container/service-bridge';
 * ```
 */
import { CoreService } from '../services/service-manager';
import type { BaseService } from '../types/core/base-service.types';

// ============================================================================
// Generic Service Bridge (일반 서비스 접근)
// ============================================================================

/**
 * 서비스를 조회합니다 (없으면 예외).
 * @template T 서비스 타입
 * @param key 서비스 키
 * @returns 서비스 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 *
 * @internal - service-accessors 내부 사용
 */
export function bridgeGetService<T>(key: string): T {
  return CoreService.getInstance().get<T>(key);
}

/**
 * 서비스를 안전하게 조회합니다 (없으면 null).
 * @template T 서비스 타입
 * @param key 서비스 키
 * @returns 서비스 인스턴스 또는 null
 *
 * @internal - service-accessors 내부 사용
 */
export function bridgeTryGet<T>(key: string): T | null {
  return CoreService.getInstance().tryGet<T>(key);
}

/**
 * 서비스를 등록합니다.
 * @template T 서비스 타입
 * @param key 서비스 키
 * @param instance 서비스 인스턴스
 *
 * @internal - service-accessors 내부 사용
 */
export function bridgeRegister<T>(key: string, instance: T): void {
  CoreService.getInstance().register<T>(key, instance);
}

// ============================================================================
// BaseService Bridge (기본 서비스 접근)
// ============================================================================

/**
 * BaseService를 등록합니다.
 * @param key 서비스 키 (SERVICE_KEYS.ANIMATION, THEME, LANGUAGE 등)
 * @param service BaseService 인스턴스
 *
 * @internal - service-accessors 내부 사용
 */
export function bridgeRegisterBaseService(key: string, service: BaseService): void {
  CoreService.getInstance().registerBaseService(key, service);
}

/**
 * BaseService를 조회합니다 (없으면 예외).
 * @param key 서비스 키
 * @returns BaseService 인스턴스
 * @throws 서비스를 찾을 수 없으면 예외 발생
 *
 * @internal
 */
export function bridgeGetBaseService(key: string): BaseService {
  return CoreService.getInstance().getBaseService(key);
}

/**
 * BaseService를 안전하게 조회합니다 (없으면 null).
 * @param key 서비스 키
 * @returns BaseService 인스턴스 또는 null
 *
 * @internal
 */
export function bridgeTryGetBaseService(key: string): BaseService | null {
  return CoreService.getInstance().tryGetBaseService(key);
}

/**
 * 단일 BaseService를 초기화합니다.
 * @param key 서비스 키
 *
 * @internal
 */
export async function bridgeInitializeBaseService(key: string): Promise<void> {
  return CoreService.getInstance().initializeBaseService(key);
}

/**
 * 모든 BaseService를 초기화합니다.
 * 초기화 순서: ANIMATION → THEME → LANGUAGE (의존성 고려)
 *
 * @param keys 초기화할 서비스 키 배열 (생략 시 모두 초기화)
 *
 * @internal
 */
export async function bridgeInitializeAllBaseServices(keys?: string[]): Promise<void> {
  return CoreService.getInstance().initializeAllBaseServices(keys);
}
