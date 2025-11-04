/**
 * @fileoverview Critical Systems Initialization
 * @description Phase 2.1: Critical Path 초기화 로직
 * Phase A5.2에서 분리된 핵심 시스템 초기화
 * Phase 343: 표준화된 에러 처리
 */

import { logger, tracePoint } from '../shared/logging';
import { warmupCriticalServices } from '../shared/container/service-accessors';
import { CRITICAL_ERROR_STRATEGY, handleBootstrapError } from './types';

/**
 * Critical Path - 필수 시스템 초기화 (동기 부분만)
 *
 * 책임:
 * - Core 서비스 등록 (동적 import)
 * - Critical Services 즉시 초기화
 * - 팩토리/서비스 강제 로드
 *
 * Phase 343: Critical 시스템으로 에러 발생 시 앱 시작 불가
 *
 * @throws {Error} Critical 초기화 실패 시 (앱 시작 불가)
 */
export async function initializeCriticalSystems(): Promise<void> {
  try {
    logger.info('Critical Path 초기화 시작');
    if (__DEV__ && tracePoint) tracePoint('critical:init:start');

    // Core 서비스 등록 (동적 import)
    const { registerCoreServices } = await import('../shared/services/core-services');
    await registerCoreServices();

    // Critical Services만 즉시 초기화
    // 강제 로드 (팩토리/서비스 즉시 활성화)
    warmupCriticalServices();

    logger.info('✅ Critical Path 초기화 완료');
    if (__DEV__ && tracePoint) tracePoint('critical:init:done');
  } catch (error) {
    // Phase 343: 표준화된 에러 처리
    handleBootstrapError(
      error,
      { ...CRITICAL_ERROR_STRATEGY, context: 'critical-systems' },
      logger
    );
  }
}
