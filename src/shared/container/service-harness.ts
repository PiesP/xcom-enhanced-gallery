/**
 * ServiceHarness — 경량 테스트 하네스
 *
 * 목적: AppContainer 없이도 테스트에서 CoreService(ServiceManager)를
 * 손쉽게 초기화/리셋하고 서비스 접근/등록을 수행하기 위한 도우미.
 *
 * 규칙:
 * - 런타임 코드에서는 사용하지 않습니다(테스트 전용 유틸).
 * - 서비스 접근은 bridge 유틸(bridgeGetService 등)로 우회하여
 *   features 레이어의 직접 의존을 피합니다.
 */
import { bridgeGetService, bridgeTryGet, bridgeRegister } from './service-bridge';
import { CoreService } from '../services/service-manager';

export class ServiceHarness {
  /** Core 서비스들을 등록합니다 (registerCoreServices 사용). */
  async initCoreServices(): Promise<void> {
    const { registerCoreServices } = await import('../services/core-services');
    await registerCoreServices();
  }

  /** 서비스 인스턴스를 등록합니다. */
  register<T>(key: string, instance: T): void {
    bridgeRegister<T>(key, instance);
  }

  /** 서비스 조회 (없으면 예외). */
  get<T>(key: string): T {
    return bridgeGetService<T>(key);
  }

  /** 서비스 안전 조회 (없으면 null). */
  tryGet<T>(key: string): T | null {
    return bridgeTryGet<T>(key);
  }

  /** 모든 등록 상태를 초기화합니다 (싱글톤 리셋). */
  reset(): void {
    CoreService.resetInstance();
  }
}

/**
 * 팩토리: 새로운 하네스 인스턴스를 생성합니다.
 */
export function createServiceHarness(): ServiceHarness {
  return new ServiceHarness();
}
