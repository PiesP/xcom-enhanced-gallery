/**
 * @fileoverview Runtime Environment Initialization - Phase 314-5
 * @description Vendor 라이브러리 및 런타임 환경 초기화, 서비스 가용성 확인
 * @module bootstrap/environment
 */

import { logger } from '../shared/logging';
import { getBootstrapDiagnostics, type BootstrapResult } from './bootstrap-info';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * 런타임 환경 초기화 (Phase 314-5, Phase 343 개선)
 * - Vendor 라이브러리 초기화 (Solid.js, Solid Store 등)
 * - 서비스 가용성 확인
 * - 부트스트랩 진단 정보 반환
 *
 * Phase 343: 표준화된 에러 처리 (Critical 시스템)
 *
 * @throws {Error} Vendor 초기화 실패 (Critical 에러)
 * @returns {Promise<BootstrapResult>} 부트스트랩 결과 및 진단 정보
 */
export async function initializeEnvironment(): Promise<BootstrapResult> {
  let diagnostics: BootstrapResult = {
    success: true,
    environment: 'unknown',
    timestamp: new Date().toISOString(),
    services: [],
    warnings: [],
    errors: [],
  };

  try {
    // 부트스트랩 진단 정보 수집
    diagnostics = await getBootstrapDiagnostics();

    // Vendor 초기화
    const { initializeVendors } = await import('../shared/external/vendors');
    await initializeVendors();
    logger.debug('[environment] ✅ Vendors initialized');

    return diagnostics;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    diagnostics.errors.push(errorMsg);
    diagnostics.success = false;

    // Phase 343: 표준화된 에러 처리 (Critical - 에러 재throw)
    handleBootstrapError(error, { ...CRITICAL_ERROR_STRATEGY, context: 'environment' }, logger);

    // handleBootstrapError가 throw하므로 여기 도달하지 않음
    // TypeScript를 위한 명시적 return (unreachable code)
    return diagnostics;
  }
}
