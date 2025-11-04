/**
 * @fileoverview Development Tools Initialization
 * @description Phase 2.1: 개발 환경 디버깅 도구
 * 개발 모드 전용 유틸리티 로딩
 */

import { logger, tracePoint } from '../shared/logging';

/**
 * 개발 환경 디버깅 도구 초기화
 *
 * 책임:
 * - 서비스 진단 도구 로딩
 * - 전역 진단 API 등록
 * - ServiceManager 상태 진단
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
    logger.warn('개발 도구 로드 실패:', error);
  }
}
