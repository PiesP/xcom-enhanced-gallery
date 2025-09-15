/**
 * Runtime stub: createAppContainer has been pruned from runtime.
 *
 * AppContainer 구현은 테스트 하네스 전용입니다. 런타임 코드에서 이 모듈을 import 하지 마세요.
 * 테스트에서는 `test/refactoring/helpers/createAppContainer`를 사용하세요.
 */
import type { AppContainer, CreateContainerOptions } from '../../shared/container/AppContainer';

export async function createAppContainer(
  _options: CreateContainerOptions = {}
): Promise<AppContainer> {
  throw new Error(
    '[createAppContainer] Runtime access is forbidden. Use service-accessors and test harness for container in tests.'
  );
}

export function installLegacyAdapter(_container: AppContainer): void {
  // No-op in runtime. Legacy adapter is removed; in tests, use the harness helper.
}
