/**
 * 런타임 환경 초기화(벤더/전역 설정)
 * - 사이드이펙트 없는 함수로 유지 (호출 시에만 동작)
 */
import { logger } from '@/shared/logging';

export async function initializeEnvironment(): Promise<void> {
  const { initializeVendors } = await import('../shared/external/vendors');
  await initializeVendors();
  logger.debug('✅ Environment: vendors initialized');
}
