/**
 * @fileoverview Development Tools Initialization
 * @description Phase 2.1: 개발 환경 디버깅 도구
 * 개발 모드 전용 유틸리티 로딩
 * Phase 343: 표준화된 에러 처리
 */

import { logger, tracePoint } from '../shared/logging';
import { NON_CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * 개발 환경 디버깅 도구 초기화
 *
 * 책임:
 * - 서비스 진단 도구 로딩
 * - 전역 진단 API 등록
 * - ServiceManager 상태 진단
 *
 * Phase 343: Non-Critical 시스템으로 실패 시 경고만
 *
 * @note 개발 환경 전용 (프로덕션에서는 tree-shaken)
 */
export async function initializeDevTools(): Promise<void> {
  if (!import.meta.env.DEV) return;

  try {
    // 서비스 진단 도구
    const { ServiceDiagnostics } = await import('../shared/services/core-services');
    // DEV 전용 전역 진단 등록 (import 부작용 제거)
    ServiceDiagnostics.registerGlobalDiagnostic();
    await ServiceDiagnostics.diagnoseServiceManager();

    logger.info('🛠️ 개발 도구 활성화됨');
    if (__DEV__ && tracePoint) tracePoint('devtools:ready');
  } catch (error) {
    // Phase 343: 표준화된 에러 처리 (Non-Critical - 경고만)
    handleBootstrapError(error, { ...NON_CRITICAL_ERROR_STRATEGY, context: 'dev-tools' }, logger);
  }
}
