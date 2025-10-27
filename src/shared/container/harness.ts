/**
 * @fileoverview TestHarness — 경량 테스트 초기화 및 서비스 관리
 * @description
 * 테스트 환경에서 CoreService를 쉽게 초기화/리셋하고,
 * 서비스 접근/등록을 수행하기 위한 도우미.
 *
 * **테스트 전용**: 런타임 코드에서 사용하지 않습니다.
 *
 * @example
 * ```typescript
 * const harness = createTestHarness();
 * await harness.initCoreServices();
 * const service = harness.get<MyService>(SERVICE_KEYS.MY_SERVICE);
 * harness.reset(); // 정리
 * ```
 */
import { bridgeGetService, bridgeTryGet, bridgeRegister } from './service-bridge';
import { CoreService } from '../services/service-manager';

/**
 * 테스트 하네스 — 테스트에서 서비스 초기화/접근/정리를 제공합니다.
 */
export class TestHarness {
  /**
   * Core 서비스들을 등록합니다.
   * @internal
   */
  async initCoreServices(): Promise<void> {
    const { registerCoreServices } = await import('../services/core-services');
    await registerCoreServices();
  }

  /**
   * 서비스 인스턴스를 등록합니다.
   * @template T 서비스 타입
   * @param key 서비스 키
   * @param instance 인스턴스
   */
  register<T>(key: string, instance: T): void {
    bridgeRegister<T>(key, instance);
  }

  /**
   * 서비스 조회 (없으면 예외).
   * @template T 서비스 타입
   * @param key 서비스 키
   * @returns 서비스 인스턴스
   */
  get<T>(key: string): T {
    return bridgeGetService<T>(key);
  }

  /**
   * 서비스 안전 조회 (없으면 null).
   * @template T 서비스 타입
   * @param key 서비스 키
   * @returns 서비스 인스턴스 또는 null
   */
  tryGet<T>(key: string): T | null {
    return bridgeTryGet<T>(key);
  }

  /**
   * 모든 등록 상태를 초기화합니다 (싱글톤 리셋).
   */
  reset(): void {
    CoreService.resetInstance();
  }
}

/**
 * 새로운 테스트 하네스 인스턴스를 생성합니다.
 * @returns TestHarness 인스턴스
 *
 * @example
 * ```typescript
 * const harness = createTestHarness();
 * ```
 */
export function createTestHarness(): TestHarness {
  return new TestHarness();
}
