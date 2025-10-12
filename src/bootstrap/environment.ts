/**
 * @fileoverview Bootstrap - Environment Initialization
 * @description 런타임 환경 초기화 (Vendor 라이브러리 등록)
 * @module bootstrap/environment
 */
import { logger } from '@/shared/logging';

/**
 * 런타임 환경을 초기화합니다
 * - Vendor 라이브러리 초기화 (Solid.js, Solid Store 등)
 * - 사이드이펙트 없는 함수로 유지 (호출 시에만 동작)
 *
 * @returns {Promise<void>}
 */
export async function initializeEnvironment(): Promise<void> {
  const { initializeVendors } = await import('../shared/external/vendors');
  await initializeVendors();
  logger.debug('✅ Environment: vendors initialized');
}
